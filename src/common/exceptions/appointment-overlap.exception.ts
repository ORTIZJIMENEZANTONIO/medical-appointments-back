import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class AppointmentOverlapException extends DomainException {
  readonly statusCode = HttpStatus.CONFLICT;

  constructor(
    message: string = 'El doctor ya tiene una cita activa en ese horario',
  ) {
    super(message);
  }
}
