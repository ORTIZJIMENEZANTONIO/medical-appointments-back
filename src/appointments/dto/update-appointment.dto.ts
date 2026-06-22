import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateAppointmentDto } from './create-appointment.dto';
import {
  IsDate,
  IsInt,
  IsISO8601,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  // No se permite actualizar el doctor ni el paciente, solo el motivo, la fecha y el estado.
  @ApiProperty({
    description: 'ID del nuevo estado de la cita (ej. 2 = CANCELLED)',
    example: 2,
  })
  @IsInt()
  @IsPositive()
  statusId?: number; // Permite actualizar el estado (ej. cancelar)

  @ApiProperty({
    description: 'Motivo de la cita',
    example: 'Consulta general',
  })
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiProperty({
    description: 'Fecha y hora de la cita',
    example: '2023-03-15T10:00:00Z',
  })
  @IsDate()
  @IsISO8601()
  date?: Date;
}
