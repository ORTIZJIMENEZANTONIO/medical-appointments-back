import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({
    description: 'Nombre del paciente',
    example: 'Juan',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El nombre no puede tener más de 20 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Primer apellido del paciente',
    example: 'Pérez',
  })
  @IsString({ message: 'El primer apellido debe ser una cadena de texto' })
  @MaxLength(20, {
    message: 'El primer apellido no puede tener más de 20 caracteres',
  })
  lastname1: string;

  @ApiPropertyOptional({
    description: 'Segundo apellido del paciente',
    example: 'Gómez',
  })
  @IsOptional()
  @IsString({ message: 'El segundo apellido debe ser una cadena de texto' })
  @MaxLength(20, {
    message: 'El segundo apellido no puede tener más de 20 caracteres',
  })
  lastname2?: string | null;

  @ApiProperty({
    description: 'Correo electrónico del paciente',
    example: 'juan.perez@example.com',
  })
  @IsString({ message: 'El correo electrónico debe ser una cadena de texto' })
  @MaxLength(150, {
    message: 'El correo electrónico no puede tener más de 150 caracteres',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({
    description: 'Teléfono del paciente',
    example: '1234567890',
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @Matches(/^\d{10}$/, {
    message: 'El teléfono debe tener exactamente 10 dígitos',
  })
  phone: string;
}
