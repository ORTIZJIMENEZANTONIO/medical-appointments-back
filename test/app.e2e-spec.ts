import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

/**
 * e2e (HTTP real + DB) — valida el stack completo: ruteo, ValidationPipe,
 * GlobalExceptionFilter y persistencia. Usa la base `${DB_NAME}_test`.
 *
 * Cubre: DOC-01/04/09/12, PAC-01, CIT-01/04/08, CIT-12+CAN-05, LIS-02.
 */
describe('Medical Appointments API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let emailSeq = 0;

  const uniqueEmail = (p: string) => `${p}${Date.now()}_${emailSeq++}@test.com`;
  const inDays = (n: number) =>
    new Date(Date.now() + n * 24 * 60 * 60_000).toISOString();

  const createDoctor = async () => {
    const res = await request(app.getHttpServer())
      .post('/doctors')
      .send({
        name: 'Juan',
        lastname1: 'Pérez',
        email: uniqueEmail('doc'),
        phone: '5512345678',
      })
      .expect(201);
    return res.body;
  };

  const createPatient = async () => {
    const res = await request(app.getHttpServer())
      .post('/patients')
      .send({
        name: 'Ana',
        lastname1: 'López',
        email: uniqueEmail('pac'),
        phone: '5598765432',
      })
      .expect(201);
    return res.body;
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Mismo ValidationPipe que main.ts (vive ahí, no en AppModule)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.query(
      `IF NOT EXISTS (SELECT 1 FROM appointment_status WHERE id = 1)
         INSERT INTO appointment_status (id, name) VALUES (1, 'ACTIVE'), (2, 'CANCELLED');`,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM appointments');
    await dataSource.query('DELETE FROM doctors');
    await dataSource.query('DELETE FROM patients');
  });

  // ── Doctores ──────────────────────────────────────────────
  describe('/doctors', () => {
    it('DOC-01: crea un doctor válido → 201', async () => {
      const doctor = await createDoctor();
      expect(doctor.id).toBeDefined();
      expect(doctor.email).toContain('@');
    });

    it('DOC-04: teléfono inválido → 400', () =>
      request(app.getHttpServer())
        .post('/doctors')
        .send({
          name: 'Juan',
          lastname1: 'Pérez',
          email: uniqueEmail('doc'),
          phone: '12345',
        })
        .expect(400));

    it('DOC-09/SEC-01: campo extra no permitido → 400', () =>
      request(app.getHttpServer())
        .post('/doctors')
        .send({
          name: 'Juan',
          lastname1: 'Pérez',
          email: uniqueEmail('doc'),
          phone: '5512345678',
          rol: 'admin',
        })
        .expect(400));

    it('DOC-12: obtener doctor inexistente → 404', () =>
      request(app.getHttpServer()).get('/doctors/999999').expect(404));
  });

  // ── Pacientes ─────────────────────────────────────────────
  describe('/patients', () => {
    it('PAC-01: crea un paciente válido → 201', async () => {
      const patient = await createPatient();
      expect(patient.id).toBeDefined();
    });
  });

  // ── Citas ─────────────────────────────────────────────────
  describe('/appointments', () => {
    it('CIT-01: agenda una cita válida → 201', async () => {
      const doctor = await createDoctor();
      const patient = await createPatient();
      const res = await request(app.getHttpServer())
        .post('/appointments')
        .send({
          doctorId: doctor.id,
          patientId: patient.id,
          appointmentDate: inDays(1),
        })
        .expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.statusId).toBe(1);
    });

    it('CIT-04: fecha pasada → 400', async () => {
      const doctor = await createDoctor();
      const patient = await createPatient();
      return request(app.getHttpServer())
        .post('/appointments')
        .send({
          doctorId: doctor.id,
          patientId: patient.id,
          appointmentDate: inDays(-1),
        })
        .expect(400);
    });

    it('CIT-08: empalme del mismo doctor → 409', async () => {
      const doctor = await createDoctor();
      const patient = await createPatient();
      const date = inDays(1);
      await request(app.getHttpServer())
        .post('/appointments')
        .send({ doctorId: doctor.id, patientId: patient.id, appointmentDate: date })
        .expect(201);
      return request(app.getHttpServer())
        .post('/appointments')
        .send({ doctorId: doctor.id, patientId: patient.id, appointmentDate: date })
        .expect(409);
    });

    it('CIT-12 + CAN-05: cancelar libera el horario', async () => {
      const doctor = await createDoctor();
      const patient = await createPatient();
      const date = inDays(1);
      const created = await request(app.getHttpServer())
        .post('/appointments')
        .send({ doctorId: doctor.id, patientId: patient.id, appointmentDate: date })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/appointments/${created.body.id}/cancel`)
        .expect(200);

      return request(app.getHttpServer())
        .post('/appointments')
        .send({ doctorId: doctor.id, patientId: patient.id, appointmentDate: date })
        .expect(201);
    });

    it('LIS-02: filtra citas por doctor → 200', async () => {
      const doctor = await createDoctor();
      const patient = await createPatient();
      await request(app.getHttpServer())
        .post('/appointments')
        .send({ doctorId: doctor.id, patientId: patient.id, appointmentDate: inDays(1) })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/appointments?doctorId=${doctor.id}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].doctorId).toBe(doctor.id);
    });
  });
});
