import { AppointmentStatus } from 'src/appointment-status/entities/appointment-status.entity';
import { Doctor } from 'src/doctors/entities/doctor.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('appointments')
// Índice que optimiza el chequeo de solapamiento: igualdad en doctor+status, rango en fecha.
// Nota: MySQL no soporta índices únicos parciales (filtered index), así que el anti-empalme
// se garantiza con el lock pesimista + el chequeo de overlap en el service (no a nivel DB).
@Index('IDX_overlap_check', ['doctorId', 'statusId', 'appointmentDate'])
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  // --- Doctor (N citas : 1 doctor) ---
  @ManyToOne(() => Doctor, (d) => d.appointments, { nullable: false })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ type: 'int', name: 'doctor_id' })
  doctorId: number;

  // --- Patient (N citas : 1 paciente) ---
  @ManyToOne(() => Patient, (p) => p.appointments, { nullable: false })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'int', name: 'patient_id' })
  patientId: number;

  // --- Status (FK al catálogo, TINYINT) ---
  @ManyToOne(() => AppointmentStatus, (s) => s.appointments, { nullable: false })
  @JoinColumn({ name: 'status_id' })
  status: AppointmentStatus;

  @Column({ type: 'tinyint', name: 'status_id', default: 1 })
  statusId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  /** Fecha + hora de inicio. Duración fija 30 min → el fin se deriva (en el overlap). */
  @Column({ type: 'datetime', precision: 0, name: 'appointment_date' })
  appointmentDate: Date;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'datetime', precision: 0, name: 'cancelled_at', nullable: true })
  cancelledAt: Date | null;
}
