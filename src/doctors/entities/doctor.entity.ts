import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('doctors')
export class Doctor {
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
