import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { VALIDATION } from '@/common/constants/messages';

export class CreateDoctorDto {
  @ApiProperty({ description: 'Nombre del doctor', example: 'Juan' })
  @IsString({ message: VALIDATION.NAME_STRING })
  @MaxLength(50, { message: VALIDATION.NAME_MAX })
  name: string;

  @ApiProperty({ description: 'Primer apellido del doctor', example: 'Pérez' })
  @IsString({ message: VALIDATION.LASTNAME1_STRING })
  @MaxLength(50, { message: VALIDATION.LASTNAME1_MAX })
  lastname1: string;

  @ApiPropertyOptional({
    description: 'Segundo apellido del doctor (opcional en México)',
    example: 'Gómez',
  })
  @IsOptional()
  @IsString({ message: VALIDATION.LASTNAME2_STRING })
  @MaxLength(50, { message: VALIDATION.LASTNAME2_MAX })
  lastname2?: string | null;

  @ApiProperty({
    description: 'Correo electrónico del doctor',
    example: 'juan.perez@example.com',
  })
  @IsString({ message: VALIDATION.EMAIL_STRING })
  @MaxLength(150, { message: VALIDATION.EMAIL_MAX })
  @IsEmail({}, { message: VALIDATION.EMAIL_INVALID })
  email: string;

  @ApiProperty({ description: 'Teléfono (10 dígitos)', example: '5512345678' })
  @IsString({ message: VALIDATION.PHONE_STRING })
  @Matches(/^\d{10}$/, { message: VALIDATION.PHONE_FORMAT })
  phone: string;
}
