import { IsFutureDate } from '@/common/validators/is-future-date.validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinDate,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'ID del doctor',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  doctorId: number;

  @ApiProperty({
    description: 'ID del paciente',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  patientId: number;

  @ApiProperty({
    example: '2026-07-01T10:00:00Z',
    description: 'Inicio (ISO 8601, futura)',
  })
  @Type(() => Date)
  @IsDate({ message: 'La fecha debe ser válida (ISO 8601)' })
  @IsFutureDate(6, 60, {
    message:
      'La fecha ingresada debe ser posterior al día de hoy y no puede exceder los próximos 6 meses.',
  })
  appointmentDate: Date;

  @ApiPropertyOptional({
    description: 'Motivo de la cita',
    example: 'Consulta general',
  })
  @IsOptional()
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El motivo no puede tener más de 255 caracteres' })
  reason?: string | null;
}
