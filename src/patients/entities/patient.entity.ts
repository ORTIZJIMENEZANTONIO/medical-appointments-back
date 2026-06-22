import { Appointment } from 'src/appointments/entities/appointment.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn()
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

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Appointment, (a) => a.patient)
  appointments: Appointment[]; // 1 paciente → N citas en distintos horarios
}
