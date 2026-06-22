import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';

/**
 * Unit — PatientsService con repositorio mockeado (sin DB).
 * Cubre: PAC-01 (crear), PAC-02 (email duplicado → 409), PAC-12 (no existe → 404).
 */
describe('PatientsService (unit)', () => {
  let service: PatientsService;
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: getRepositoryToken(Patient), useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(PatientsService);
  });

  it('crea un paciente cuando el email no existe', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue({ name: 'Ana' });
    repo.save.mockResolvedValue({ id: 1, name: 'Ana' });

    const res = await service.create({ email: 'b@b.com' } as never);

    expect(res).toEqual({ id: 1, name: 'Ana' });
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('rechaza email duplicado con ConflictException (409)', async () => {
    repo.findOne.mockResolvedValue({ id: 1 });

    await expect(service.create({ email: 'b@b.com' } as never)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('findOne lanza NotFoundException (404) si no existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
