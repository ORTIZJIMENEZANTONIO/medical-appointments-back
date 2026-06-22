import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './entities/patient.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly PatientsRepository: Repository<Patient>,
  ) {}

  async create(createPatientDto: CreatePatientDto) {
    const exists = await this.PatientsRepository.findOne({
      where: { email: createPatientDto.email },
    });

    if (exists) {
      throw new ConflictException('El Patient ya existe');
    }

    const Patient = this.PatientsRepository.create(createPatientDto);
    return this.PatientsRepository.save(Patient);
  }

  async findAll(): Promise<Patient[]> {
    return this.PatientsRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Patient> {
    const Patient = await this.PatientsRepository.findOne({ where: { id } });
    if (!Patient) throw new NotFoundException(`Patient ${id} no existe`);
    return Patient;
  }

  async update(
    id: number,
    updatePatientDto: UpdatePatientDto,
  ): Promise<Patient> {
    await this.PatientsRepository.update(id, updatePatientDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.PatientsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Patient ${id} no existe`);
    }
  }
}
