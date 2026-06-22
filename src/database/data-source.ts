import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

import { Doctor } from 'src/doctors/entities/doctor.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { AppointmentStatus } from 'src/appointment-status/entities/appointment-status.entity';

// El .env sobrescribe cualquier variable ya presente en el shell.
dotenv.config({ override: true });

// En tests (Jest fija NODE_ENV='test') se usa una BD separada con auto-schema,
// para no tocar datos de desarrollo ni depender de correr migraciones.
const isTest = process.env.NODE_ENV === 'test';
const databaseName = isTest
  ? `${process.env.DB_NAME}_test`
  : process.env.DB_NAME;

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: databaseName,
  entities: [Patient, Doctor, Appointment, AppointmentStatus],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: isTest, // tests: auto-schema; dev/prod: migraciones (única fuente de verdad)
  logging: process.env.NODE_ENV === 'development',
};

// Usado por el CLI de TypeORM (migration:generate / run / revert).
// Solo un export de tipo DataSource (el default) — el CLI lo exige.
const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
