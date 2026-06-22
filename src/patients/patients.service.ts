import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { ERRORS } from '@/common/constants/messages';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    const exists = await this.patientsRepository.findOne({
      where: { email: createPatientDto.email },
    });
    if (exists) {
      throw new ConflictException(ERRORS.EMAIL_ALREADY_REGISTERED);
    }
    const patient = this.patientsRepository.create(createPatientDto);
    return this.patientsRepository.save(patient);
  }

  findAll(): Promise<Patient[]> {
    return this.patientsRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({ where: { id } });
    if (!patient) throw new NotFoundException(ERRORS.PATIENT_NOT_FOUND);
    return patient;
  }
}
