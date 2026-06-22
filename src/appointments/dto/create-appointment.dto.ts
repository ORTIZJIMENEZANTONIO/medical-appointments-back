import { IsFutureDate } from '@/common/validators/is-future-date.validator';
import { VALIDATION } from '@/common/constants/messages';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID del doctor', example: 1 })
  @IsInt({ message: VALIDATION.ID_INT })
  @IsPositive({ message: VALIDATION.ID_POSITIVE })
  doctorId: number;

  @ApiProperty({ description: 'ID del paciente', example: 1 })
  @IsInt({ message: VALIDATION.ID_INT })
  @IsPositive({ message: VALIDATION.ID_POSITIVE })
  patientId: number;

  @ApiProperty({
    example: '2026-07-01T10:00:00Z',
    description: 'Inicio en ISO 8601 con zona (UTC). Ej. 2026-07-01T10:00:00Z',
  })
  @Type(() => Date)
  @IsDate({ message: VALIDATION.DATE_INVALID })
  @IsFutureDate(6, 60) // futura, mín. 60 min de anticipación, máx. 6 meses (mensaje desde el validador)
  appointmentDate: Date;

  @ApiPropertyOptional({ description: 'Motivo de la cita', example: 'Consulta general' })
  @IsOptional()
  @IsString({ message: VALIDATION.REASON_STRING })
  @MaxLength(255, { message: VALIDATION.REASON_MAX })
  reason?: string | null;
}
