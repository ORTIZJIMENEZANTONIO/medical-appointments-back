import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { DoctorsService } from '../src/doctors/doctors.service';
import { PatientsService } from '../src/patients/patients.service';
import { AppointmentOverlapException } from '../src/common/exceptions/appointment-overlap.exception';

/**
 * Integración (DB real) — valida la lógica que depende de SQL Server:
 * overlap, back-to-back, multi-doctor, cancelación libera horario y concurrencia.
 * Requiere la base `${DB_NAME}_test` creada (synchronize crea el schema).
 *
 * Cubre: CIT-08, CIT-10, CIT-11, CIT-12, CAN-05, CON-01.
 */
describe('Appointments (integration, real DB)', () => {
  let moduleRef: TestingModule;
  let appointments: AppointmentsService;
  let doctors: DoctorsService;
  let patients: PatientsService;
  let dataSource: DataSource;

  let emailSeq = 0;
  const uniqueEmail = (p: string) => `${p}${Date.now()}_${emailSeq++}@test.com`;

  const inMinutes = (n: number) => new Date(Date.now() + n * 60_000);

  const seedDoctorPatient = async () => {
    const doctor = await doctors.create({
      name: 'Juan',
      lastname1: 'Pérez',
      email: uniqueEmail('doc'),
      phone: '5512345678',
    } as never);
    const patient = await patients.create({
      name: 'Ana',
      lastname1: 'López',
      email: uniqueEmail('pac'),
      phone: '5598765432',
    } as never);
    return { doctor, patient };
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    appointments = moduleRef.get(AppointmentsService);
    doctors = moduleRef.get(DoctorsService);
    patients = moduleRef.get(PatientsService);
    dataSource = moduleRef.get(DataSource);

    // Catálogo de estados (synchronize crea las tablas vacías)
    await dataSource.query(
      `IF NOT EXISTS (SELECT 1 FROM appointment_status WHERE id = 1)
         INSERT INTO appointment_status (id, name) VALUES (1, 'ACTIVE'), (2, 'CANCELLED');`,
    );
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    // Limpieza en orden seguro de FK (citas → doctores/pacientes). Catálogo se conserva.
    await dataSource.query('DELETE FROM appointments');
    await dataSource.query('DELETE FROM doctors');
    await dataSource.query('DELETE FROM patients');
  });

  it('CIT-08: rechaza un empalme exacto con AppointmentOverlapException', async () => {
    const { doctor, patient } = await seedDoctorPatient();
    const date = inMinutes(1440); // +1 día

    await appointments.create({
      doctorId: doctor.id,
      patientId: patient.id,
      appointmentDate: date,
      reason: null,
    } as never);

    await expect(
      appointments.create({
        doctorId: doctor.id,
        patientId: patient.id,
        appointmentDate: date,
        reason: null,
      } as never),
    ).rejects.toBeInstanceOf(AppointmentOverlapException);
  });

  it('CIT-10: permite back-to-back (exactamente +30 min)', async () => {
    const { doctor, patient } = await seedDoctorPatient();
    const base = inMinutes(1440);

    await appointments.create({
      doctorId: doctor.id,
      patientId: patient.id,
      appointmentDate: base,
      reason: null,
    } as never);

    const next = new Date(base.getTime() + 30 * 60_000);
    const res = await appointments.create({
      doctorId: doctor.id,
      patientId: patient.id,
      appointmentDate: next,
      reason: null,
    } as never);

    expect(res.id).toBeDefined();
  });

  it('CIT-11: permite el mismo horario para doctores distintos', async () => {
    const { doctor, patient } = await seedDoctorPatient();
    const doctor2 = await doctors.create({
      name: 'Otro',
      lastname1: 'Doc',
      email: uniqueEmail('doc2'),
      phone: '5511112222',
    } as never);
    const date = inMinutes(1440);

    await appointments.create({
      doctorId: doctor.id,
      patientId: patient.id,
      appointmentDate: date,
      reason: null,
    } as never);

    const res = await appointments.create({
      doctorId: doctor2.id,
      patientId: patient.id,
      appointmentDate: date,
      reason: null,
    } as never);

    expect(res.id).toBeDefined();
  });

  it('CIT-12 + CAN-05: una cita cancelada libera el horario', async () => {
    const { doctor, patient } = await seedDoctorPatient();
    const date = inMinutes(1440);

    const created = await appointments.create({
      doctorId: doctor.id,
      patientId: patient.id,
      appointmentDate: date,
      reason: null,
    } as never);

    await appointments.cancel(created.id);

    // El mismo horario debe quedar disponible tras cancelar
    const res = await appointments.create({
      doctorId: doctor.id,
      patientId: patient.id,
      appointmentDate: date,
      reason: null,
    } as never);

    expect(res.id).toBeDefined();
  });

  it('CON-01: dos creaciones concurrentes → 1 éxito y 1 conflicto', async () => {
    const { doctor, patient } = await seedDoctorPatient();
    const date = inMinutes(1440);
    const payload = {
      doctorId: doctor.id,
      patientId: patient.id,
      appointmentDate: date,
      reason: null,
    } as never;

    const results = await Promise.allSettled([
      appointments.create({ ...(payload as object) } as never),
      appointments.create({ ...(payload as object) } as never),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      AppointmentOverlapException,
    );
  });
});
