import { PartialType } from '@nestjs/swagger';
import { CreateDoctorDto } from './create-doctor.dto';

export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {
  // No se permite actualizar el ID ni la fecha de creación, solo el resto de campos.
}
