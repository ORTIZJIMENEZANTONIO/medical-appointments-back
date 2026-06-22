import { Appointment } from 'src/appointments/entities/appointment.entity';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity('appointment_status')
export class AppointmentStatus {
  // Catálogo con IDs fijos (1=ACTIVE, 2=CANCELLED).
  @PrimaryColumn({ type: 'tinyint' })
  id: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  name: string;

  @OneToMany(() => Appointment, (a) => a.status)
  appointments: Appointment[];
}
