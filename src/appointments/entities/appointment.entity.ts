import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  doctorId: number;

  @Column()
  patientId: number;

  @Column()
  appointmentDate: Date;

  @Column()
  reason: string;

  @Column()
  status: string;
}
