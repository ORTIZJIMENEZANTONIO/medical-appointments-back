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

    appointmentDate.setMilliseconds(0);

    const limitStart = new Date(
      appointmentDate.getTime() - APPOINTMENT_DURATION_MINUTES * 60000,
    );
    const limitEnd = new Date(
      appointmentDate.getTime() + APPOINTMENT_DURATION_MINUTES * 60000,
    );

    return this.dataSource.transaction('READ COMMITTED', async (manager) => {
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
        WHERE doctor_id = ?
          AND status_id = ?
          AND appointment_date > ?
          AND appointment_date < ?
        `,
        [createAppointmentDto.doctorId, STATUS_ACTIVE, limitStart, limitEnd],
      );

      if (Number(overlapping[0].count) > 0) {
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
    return this.dataSource.transaction('READ COMMITTED', async (manager) => {
      // Transición atómica: solo cancela si la cita sigue ACTIVA. El guard va en el
      // WHERE, no en una lectura previa, para que dos cancelaciones concurrentes de la
      // misma cita no puedan pasar ambas (sin esto, ambas leerían ACTIVE y responderían
      // 200; aquí solo una toca 1 fila y la otra cae al 404/409 según corresponda).
      const result = await manager.update(
        Appointment,
        { id, statusId: STATUS_ACTIVE },
        { statusId: STATUS_CANCELLED, cancelledAt: new Date() },
      );

      if (result.affected === 0) {
        // No se actualizó nada: o la cita no existe, o ya estaba cancelada.
        const appointment = await manager.findOne(Appointment, {
          where: { id },
        });
        if (!appointment) {
          throw new NotFoundException(ERRORS.APPOINTMENT_NOT_FOUND);
        }
        throw new ConflictException(ERRORS.APPOINTMENT_ALREADY_CANCELLED);
      }

      // Releemos dentro de la misma transacción (la repo externa no vería el UPDATE
      // aún sin commitear bajo READ COMMITTED).
      return manager.findOneOrFail(Appointment, {
        where: { id },
        relations: ['doctor', 'patient', 'status'],
      });
    });
  }
}
