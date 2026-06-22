import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { Doctor } from './entities/doctor.entity';

/**
 * Unit — DoctorsService con repositorio mockeado (sin DB).
 * Cubre: DOC-01 (crear), DOC-02 (email duplicado → 409), DOC-12 (no existe → 404).
 */
describe('DoctorsService (unit)', () => {
  let service: DoctorsService;
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
        DoctorsService,
        { provide: getRepositoryToken(Doctor), useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(DoctorsService);
  });

  it('crea un doctor cuando el email no existe', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue({ name: 'Juan' });
    repo.save.mockResolvedValue({ id: 1, name: 'Juan' });

    const res = await service.create({ email: 'a@a.com' } as never);

    expect(res).toEqual({ id: 1, name: 'Juan' });
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('rechaza email duplicado con ConflictException (409)', async () => {
    repo.findOne.mockResolvedValue({ id: 1 });

    await expect(service.create({ email: 'a@a.com' } as never)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('findOne lanza NotFoundException (404) si no existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
