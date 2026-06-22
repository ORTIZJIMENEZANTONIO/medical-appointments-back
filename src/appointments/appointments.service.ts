import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { Doctor } from '@/doctors/entities/doctor.entity';
import { Patient } from '@/patients/entities/patient.entity';
import { AppointmentOverlapException } from '@/common/exceptions/appointment-overlap.exception';

const APPOINTMENT_DURATION_MINUTES = 30; // Duración fija de 30 minutos
const STATUS_ACTIVE = 1; // ID del estado "ACTIVE" en el catálogo de estados
const STATUS_CANCELLED = 2; // ID del estado "CANCELLED" en el catálogo de estados

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectDataSource() private dataSource: DataSource, // Inyecta el DataSource para consultas personalizadas
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>, // Inyecta el repositorio de Appointment
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const appointmentDate = new Date(createAppointmentDto.appointmentDate);
    const limitStart = new Date(
      appointmentDate.getTime() - APPOINTMENT_DURATION_MINUTES * 60000,
    );
    const limitEnd = new Date(
      appointmentDate.getTime() + APPOINTMENT_DURATION_MINUTES * 60000,
    );

    return this.dataSource.transaction(async (manager) => {
      const doctor = await manager
        .createQueryBuilder(Doctor, 'd')
        .setLock('pessimistic_write')
        .where('d.id = :id', { id: createAppointmentDto.doctorId })
        .getOne();

      /* Validar doctor existente */
      if (!doctor) {
        throw new NotFoundException('Doctor no encontrado');
      }

      const patient = await manager.findOne(Patient, {
        where: { id: createAppointmentDto.patientId },
      });

      /* Validar paciente existente */
      if (!patient) {
        throw new NotFoundException('Paciente no encontrado');
      }

      /* Verificar solapamiento de citas ACTIVAS para el mismo doctor */
      const overlappingAppointments = await manager.query(
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

      if (overlappingAppointments[0].count > 0) {
        throw new AppointmentOverlapException(
          'El doctor ya tiene una cita activa que se traslapa con ese horario',
        );
      }

      // Si no hay solapamientos, crear la nueva cita
      const newAppointment = this.appointmentRepository.create({
        doctorId: createAppointmentDto.doctorId,
        patientId: createAppointmentDto.patientId,
        appointmentDate: appointmentDate,
        reason: createAppointmentDto.reason || null,
        statusId: STATUS_ACTIVE, // Asignar estado "ACTIVE" por defecto
      });

      return await manager.save(newAppointment);
    });
  }

  async findAll(query: QueryAppointmentsDto): Promise<Appointment[]> {
    const qd = this.appointmentRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.doctor', 'doctor')
      .leftJoinAndSelect('a.patient', 'patient')
      .leftJoinAndSelect('a.status', 'status')
      .orderBy('a.appointment_date', 'ASC');

    if (query.doctorId) {
      qd.andWhere('a.doctorId = :doctorId', {
        doctorId: query.doctorId,
      });
    }

    if (query.patientId) {
      qd.andWhere('a.patientId = :patientId', {
        patientId: query.patientId,
      });
    }

    if (query.statusId) {
      qd.andWhere('a.statusId = :statusId', {
        statusId: query.statusId,
      });
    }

    if (query.startDate) {
      qd.andWhere('a.appointmentDate >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      qd.andWhere('a.appointmentDate <= :endDate', {
        endDate: query.endDate,
      });
    }

    return qd.getMany();
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['doctor', 'patient', 'status'],
    });

    if (!appointment) throw new NotFoundException(`Cita ${id} no existe`);
    return appointment;
  }

  async cancel(id: number): Promise<Appointment> {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, {
        where: { id },
      });

      if (!appointment) {
        throw new NotFoundException(`Cita ${id} no existe`);
      }

      if (appointment.statusId === STATUS_CANCELLED) {
        throw new ConflictException(`La cita #${id} ya está cancelada.`);
      }

      appointment.statusId = STATUS_CANCELLED;
      appointment.cancelledAt = new Date();

      return await manager.save(appointment);
    });
  }

  update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    return `This action updates a #${id} appointment`;
  }

  remove(id: number) {
    return `This action removes a #${id} appointment`;
  }
}
