import { Injectable } from '@nestjs/common';
import { CreateAppointmentStatusDto } from './dto/create-appointment-status.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@Injectable()
export class AppointmentStatusService {
  create(createAppointmentStatusDto: CreateAppointmentStatusDto) {
    return 'This action adds a new appointmentStatus';
  }

  findAll() {
    return `This action returns all appointmentStatus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} appointmentStatus`;
  }

  update(id: number, updateAppointmentStatusDto: UpdateAppointmentStatusDto) {
    return `This action updates a #${id} appointmentStatus`;
  }

  remove(id: number) {
    return `This action removes a #${id} appointmentStatus`;
  }
}
