import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateAppointmentStatusDto {
  @ApiProperty({
    description: 'Nombre del estado de la cita (ej. ACTIVE, CANCELLED)',
    example: 'ACTIVE',
  })
  @IsString()
  @MaxLength(50)
  name: string;
}
