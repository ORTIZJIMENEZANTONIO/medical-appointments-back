import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorsRepository: Repository<Doctor>,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const exists = await this.doctorsRepository.findOne({
      where: { email: createDoctorDto.email },
    });
    if (exists) {
      throw new ConflictException(
        `Ya existe un doctor con el email ${createDoctorDto.email}`,
      );
    }
    const doctor = this.doctorsRepository.create(createDoctorDto);
    return this.doctorsRepository.save(doctor);
  }

  findAll(): Promise<Doctor[]> {
    return this.doctorsRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Doctor> {
    const doctor = await this.doctorsRepository.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException(`Doctor ${id} no existe`);
    return doctor;
  }
}
