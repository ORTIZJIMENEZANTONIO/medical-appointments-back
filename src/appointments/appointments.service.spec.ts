import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentOverlapException } from '@/common/exceptions/appointment-overlap.exception';

/**
 * Unit — AppointmentsService con DataSource/manager mockeados (sin DB).
 * Verifica la lógica de ramificación de create() y cancel().
 * El overlap real (SQL) y la concurrencia se prueban en integración.
 * Cubre: CIT-02/03 (404), CIT-08 (409 overlap, lógica), CAN-02/03 (404/409).
 */
describe('AppointmentsService (unit)', () => {
  let service: AppointmentsService;
  let manager: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    query: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let qb: { setLock: jest.Mock; where: jest.Mock; getOne: jest.Mock };

  const futureDate = () => new Date(Date.now() + 24 * 60 * 60_000);
  const dto = () =>
    ({
      doctorId: 1,
      patientId: 1,
      appointmentDate: futureDate(),
      reason: null,
    }) as never;

  beforeEach(async () => {
    qb = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    manager = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOne: jest.fn(),
      query: jest.fn(),
      create: jest.fn((_entity, value) => value),
      save: jest.fn((value) => Promise.resolve({ id: 1, ...value })),
    };
    const dataSource = {
      // Soporta transaction(cb) y transaction(isolationLevel, cb)
      transaction: jest.fn((arg1: unknown, arg2?: unknown) => {
        const cb = (typeof arg1 === 'function' ? arg1 : arg2) as (
          m: typeof manager,
        ) => unknown;
        return cb(manager);
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: getRepositoryToken(Appointment), useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(AppointmentsService);
  });

  describe('create', () => {
    it('crea la cita cuando no hay empalme', async () => {
      qb.getOne.mockResolvedValue({ id: 1 }); // doctor existe
      manager.findOne.mockResolvedValue({ id: 1 }); // paciente existe
      manager.query.mockResolvedValue([{ count: 0 }]); // sin overlap

      const res = await service.create(dto());

      expect(manager.save).toHaveBeenCalledTimes(1);
      expect(res).toMatchObject({ statusId: 1 });
    });

    it('lanza 404 si el doctor no existe', async () => {
      qb.getOne.mockResolvedValue(null);
      await expect(service.create(dto())).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('lanza 404 si el paciente no existe', async () => {
      qb.getOne.mockResolvedValue({ id: 1 });
      manager.findOne.mockResolvedValue(null);
      await expect(service.create(dto())).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('lanza AppointmentOverlapException (409) si hay empalme', async () => {
      qb.getOne.mockResolvedValue({ id: 1 });
      manager.findOne.mockResolvedValue({ id: 1 });
      manager.query.mockResolvedValue([{ count: 1 }]); // hay overlap

      await expect(service.create(dto())).rejects.toBeInstanceOf(
        AppointmentOverlapException,
      );
      expect(manager.save).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('cancela una cita activa (status → 2, sella cancelledAt)', async () => {
      manager.findOne.mockResolvedValue({ id: 5, statusId: 1 });

      const res = await service.cancel(5);

      expect(res.statusId).toBe(2);
      expect(res.cancelledAt).toBeInstanceOf(Date);
    });

    it('lanza 404 si la cita no existe', async () => {
      manager.findOne.mockResolvedValue(null);
      await expect(service.cancel(5)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza 409 si la cita ya está cancelada', async () => {
      manager.findOne.mockResolvedValue({ id: 5, statusId: 2 });
      await expect(service.cancel(5)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
