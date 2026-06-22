import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateAppointmentStatusDto } from './create-appointment-status.dto';
import { IsString, MaxLength } from 'class-validator';

export class UpdateAppointmentStatusDto extends PartialType(
  CreateAppointmentStatusDto,
) {
  // No se permite actualizar el ID, solo el nombre.
  @ApiProperty({
    description: 'Nombre del estado de la cita (ej. ACTIVE, CANCELLED)',
    example: 'ACTIVE',
  })
  @IsString()
  @MaxLength(30)
  name: string;
}
