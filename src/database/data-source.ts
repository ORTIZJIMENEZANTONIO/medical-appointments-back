import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

import { Doctor } from 'src/doctors/entities/doctor.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';

dotenv.config();
dotenv.config({ override: true });

export const dataSourceOptions: DataSourceOptions = {
  type: 'mssql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Doctor, Patient, Appointment],
  synchronize: false, // Set to true only in development, false in production
  logging: process.env.NODE_ENV === 'development',
  migrations: [__dirname + '/../migrations/*{.ts,.js}'], // ⬅️  faltaba (para el CLI)
  options: {
    encrypt: false, // local; en prod: true con cert válido
    trustServerCertificate: true, // ⬅️  ESTO silencia el self-signed certificate
  },
};

export const AppDataSource = new DataSource(dataSourceOptions);

export const initializeDataSource = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');
  } catch (err) {
    console.error('Error during Data Source initialization:', err);
  }
};
