import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lastname1: string;

  @Column()
  lastname2: string;

  @Column()
  email: string;

  @Column()
  specialty: string;
}
