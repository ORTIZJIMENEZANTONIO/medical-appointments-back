import { PartialType } from '@nestjs/swagger';
import { CreateAppointmentStatusDto } from './create-appointment-status.dto';

export class UpdateAppointmentStatusDto extends PartialType(CreateAppointmentStatusDto) {}
