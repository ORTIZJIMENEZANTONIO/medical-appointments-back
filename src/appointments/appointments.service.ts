import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { Doctor } from '@/doctors/entities/doctor.entity';
import { Patient } from '@/patients/entities/patient.entity';
import { AppointmentOverlapException } from '@/common/exceptions/appointment-overlap.exception';
import { ERRORS } from '@/common/constants/messages';

const APPOINTMENT_DURATION_MINUTES = 30; // Duración fija de 30 minutos
const STATUS_ACTIVE = 1; // ID del estado "ACTIVE" en el catálogo
const STATUS_CANCELLED = 2; // ID del estado "CANCELLED" en el catálogo

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const appointmentDate = new Date(createAppointmentDto.appointmentDate);
    // La columna es datetime2(0) (precisión de segundos). Normalizamos los
    // milisegundos a 0 para que el valor guardado y la ventana de overlap usen
    // la MISMA precisión — si no, el redondeo de sub-segundos de SQL Server
    // provoca falsos empalmes en el borde (ej. citas back-to-back a +30 min).
    appointmentDate.setMilliseconds(0);
    // Con duración fija de 30 min, dos citas se cruzan si el inicio de la
    // existente cae dentro de (inicio - 30min, inicio + 30min). Ventana sargable.
    const limitStart = new Date(
      appointmentDate.getTime() - APPOINTMENT_DURATION_MINUTES * 60000,
    );
    const limitEnd = new Date(
      appointmentDate.getTime() + APPOINTMENT_DURATION_MINUTES * 60000,
    );

    return this.dataSource.transaction(async (manager) => {
      // Lock pesimista sobre el doctor → serializa las reservas de ESTE doctor.
      const doctor = await manager
        .createQueryBuilder(Doctor, 'd')
        .setLock('pessimistic_write')
        .where('d.id = :id', { id: createAppointmentDto.doctorId })
        .getOne();
      if (!doctor) {
        throw new NotFoundException(ERRORS.DOCTOR_NOT_FOUND);
      }

      const patient = await manager.findOne(Patient, {
        where: { id: createAppointmentDto.patientId },
      });
      if (!patient) {
        throw new NotFoundException(ERRORS.PATIENT_NOT_FOUND);
      }

      // Solapamiento con citas ACTIVAS del mismo doctor (canceladas no cuentan).
      const overlapping = await manager.query(
        `
        SELECT COUNT(id) AS count
        FROM appointments
        WHERE doctor_id = @0
          AND status_id = @1
          AND appointment_date > @2
          AND appointment_date < @3
        `,
        [createAppointmentDto.doctorId, STATUS_ACTIVE, limitStart, limitEnd],
      );

      if (overlapping[0].count > 0) {
        throw new AppointmentOverlapException();
      }

      const newAppointment = manager.create(Appointment, {
        doctorId: createAppointmentDto.doctorId,
        patientId: createAppointmentDto.patientId,
        appointmentDate,
        reason: createAppointmentDto.reason ?? null,
        statusId: STATUS_ACTIVE,
      });

      return manager.save(newAppointment);
    });
  }

  findAll(query: QueryAppointmentsDto): Promise<Appointment[]> {
    const qd = this.appointmentRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.doctor', 'doctor')
      .leftJoinAndSelect('a.patient', 'patient')
      .leftJoinAndSelect('a.status', 'status')
      .orderBy('a.appointmentDate', 'ASC');

    if (query.doctorId) {
      qd.andWhere('a.doctorId = :doctorId', { doctorId: query.doctorId });
    }
    if (query.patientId) {
      qd.andWhere('a.patientId = :patientId', { patientId: query.patientId });
    }
    if (query.statusId) {
      qd.andWhere('a.statusId = :statusId', { statusId: query.statusId });
    }
    if (query.startDate) {
      qd.andWhere('a.appointmentDate >= :startDate', {
        startDate: query.startDate,
      });
    }
    if (query.endDate) {
      qd.andWhere('a.appointmentDate <= :endDate', { endDate: query.endDate });
    }

    return qd.getMany();
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['doctor', 'patient', 'status'],
    });
    if (!appointment) throw new NotFoundException(ERRORS.APPOINTMENT_NOT_FOUND);
    return appointment;
  }

  async cancel(id: number): Promise<Appointment> {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, { where: { id } });
      if (!appointment) {
        throw new NotFoundException(ERRORS.APPOINTMENT_NOT_FOUND);
      }
      if (appointment.statusId === STATUS_CANCELLED) {
        throw new ConflictException(ERRORS.APPOINTMENT_ALREADY_CANCELLED);
      }

      appointment.statusId = STATUS_CANCELLED;
      appointment.cancelledAt = new Date();

      return manager.save(appointment);
    });
  }
}
