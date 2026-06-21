import { Appointment } from 'src/appointments/entities/appointment.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('appointment_status')
export class AppointmentStatus {
  // Catálogo con IDs fijos (1=ACTIVE, 2=CANCELLED).
  @PrimaryGeneratedColumn({ type: 'tinyint' })
  id: number;

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @OneToMany(() => Appointment, (a) => a.statusId)
  appointments: Appointment[];
}
