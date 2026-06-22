import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, IsPositive } from 'class-validator';
import { VALIDATION } from '@/common/constants/messages';

export class QueryAppointmentsDto {
  @ApiPropertyOptional({ type: Number, description: 'Filtrar por doctor' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION.ID_INT })
  @IsPositive({ message: VALIDATION.ID_POSITIVE })
  doctorId?: number;

  @ApiPropertyOptional({ type: Number, description: 'Filtrar por paciente' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION.ID_INT })
  @IsPositive({ message: VALIDATION.ID_POSITIVE })
  patientId?: number;

  @ApiPropertyOptional({ enum: [1, 2], description: '1=ACTIVE, 2=CANCELLED' })
  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 2], { message: VALIDATION.STATUS_INVALID })
  statusId?: number;

  @ApiPropertyOptional({ type: String, description: 'Desde (ISO 8601)' })
  @IsOptional()
  @IsISO8601({}, { message: VALIDATION.DATE_RANGE_ISO })
  startDate?: string;

  @ApiPropertyOptional({ type: String, description: 'Hasta (ISO 8601)' })
  @IsOptional()
  @IsISO8601({}, { message: VALIDATION.DATE_RANGE_ISO })
  endDate?: string;
}
