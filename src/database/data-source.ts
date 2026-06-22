import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

import { Doctor } from 'src/doctors/entities/doctor.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { AppointmentStatus } from 'src/appointment-status/entities/appointment-status.entity';

// El .env sobrescribe cualquier variable ya presente en el shell.
dotenv.config({ override: true });

export const dataSourceOptions: DataSourceOptions = {
  type: 'mssql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Patient, Doctor, Appointment, AppointmentStatus],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false, // las migraciones son la única fuente de verdad del schema
  logging: process.env.NODE_ENV === 'development',
  options: {
    encrypt: false, // local; en prod: true con certificado válido
    trustServerCertificate: true, // confía en el cert autofirmado del contenedor local
  },
};

// Usado por el CLI de TypeORM (migration:generate / run / revert)
export const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
