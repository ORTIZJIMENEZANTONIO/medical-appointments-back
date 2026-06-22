import { PartialType } from '@nestjs/swagger';
import { CreatePatientDto } from './create-patient.dto';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  // No se permite actualizar el ID ni la fecha de creación, solo el resto de campos. 
}
