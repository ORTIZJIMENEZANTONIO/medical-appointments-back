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
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('appointments')
// Índice que optimiza el chequeo de solapamiento: igualdad en doctor+status, rango en fecha
@Index('IDX_overlap_check', ['doctorId', 'statusId', 'appointmentDate'])
// (Opcional, defensa a nivel DB) impide 2 citas ACTIVAS del mismo doctor en el MISMO instante.
// Filtered index = feature de SQL Server. El solapamiento general (±30min) lo cubre el service.
@Index('UQ_doctor_active_slot', ['doctorId', 'appointmentDate'], {
  unique: true,
  where: 'status_id = 1',
})
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
  @ManyToOne(() => AppointmentStatus, (s) => s.appointments, {
    nullable: false,
  })
  @JoinColumn({ name: 'status_id' })
  status: AppointmentStatus;

  @Column({ type: 'tinyint', name: 'status_id', default: 1 })
  statusId: number;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  reason: string | null;

  /** Fecha + hora de inicio. Duración fija 30min → el fin se deriva (DATEADD en el overlap). */
  @Column({ type: 'datetime2', precision: 0, name: 'appointment_date' })
  appointmentDate: Date;

  @CreateDateColumn({
    type: 'datetime2',
    precision: 0,
    default: () => 'GETDATE()',
    name: 'created_at',
  })
  createdAt: Date;

  @Column({
    type: 'datetime2',
    precision: 0,
    name: 'cancelled_at',
    nullable: true,
  })
  cancelledAt: Date | null;
}
