import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsIn } from 'class-validator';

export class QueryAppointmentsDto {
  @ApiPropertyOptional({ type: Number, description: 'ID del doctor' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsPositive()
  doctorId?: number;

  @ApiPropertyOptional({ type: Number, description: 'ID del paciente' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsPositive()
  patientId?: number;

  @ApiPropertyOptional({ enum: [1, 2], description: '1=ACTIVE, 2=CANCELLED' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2], { message: 'El statusId debe ser 1 (ACTIVE) o 2 (CANCELLED)' })
  statusId?: number;

  @ApiPropertyOptional({ type: String, description: 'Fecha de inicio' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ type: String, description: 'Fecha de fin' })
  @IsOptional()
  endDate?: string;
}
