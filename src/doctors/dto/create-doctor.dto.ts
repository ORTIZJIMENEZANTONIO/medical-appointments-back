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

export class CreateDoctorDto {
  @ApiProperty({
    description: 'Nombre del doctor',
    example: 'Juan',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El nombre no puede tener más de 20 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Primer apellido del doctor',
    example: 'Pérez',
  })
  @IsString({ message: 'El primer apellido debe ser una cadena de texto' })
  @MaxLength(50, {
    message: 'El primer apellido no puede tener más de 20 caracteres',
  })
  lastname1: string;

  @ApiPropertyOptional({
    description: 'Segundo apellido del doctor (opcional)',
    example: 'Gómez',
  })
  @IsOptional()
  @IsString({ message: 'El segundo apellido debe ser una cadena de texto' })
  @MaxLength(50, {
    message: 'El segundo apellido no puede tener más de 20 caracteres',
  })
  lastname2?: string | null;

  @ApiProperty({
    description: 'Correo electrónico del doctor',
    example: 'juan.perez@example.com',
  })
  @IsString({ message: 'El correo electrónico debe ser una cadena de texto' })
  @MaxLength(150, {
    message: 'El correo electrónico no puede tener más de 150 caracteres',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({
    description: 'Teléfono del doctor',
    example: '1234567890',
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @Matches(/^\d{10}$/, {
    message: 'El teléfono debe tener exactamente 10 dígitos',
  })
  phone: string;
}
