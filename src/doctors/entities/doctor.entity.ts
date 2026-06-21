import { Appointment } from 'src/appointments/entities/appointment.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 20 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  lastname1: string;

  @Column({ type: 'varchar', length: 20 })
  lastname2: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 10 })
  phone: string;

  @Column({ type: 'varchar', length: 100 })
  specialty: string;

  @CreateDateColumn({ type: 'datetime2', precision: 0 })
  createdAt: Date;

  @OneToMany(() => Appointment, (a) => a.doctor)
  appointments: Appointment[]; // 1 doctor → N citas
}
