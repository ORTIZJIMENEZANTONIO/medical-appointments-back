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

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 50, name: 'last_name_1' })
  lastname1: string;

  @Column({ type: 'varchar', length: 50, name: 'last_name_2', nullable: true })
  lastname2?: string | null; // apellido materno: opcional en México

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 10 })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialty?: string | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Appointment, (a) => a.doctor)
  appointments: Appointment[]; // 1 doctor → N citas
}
