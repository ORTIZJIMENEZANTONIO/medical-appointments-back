import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';
import { ERRORS } from '@/common/constants/messages';

export class AppointmentOverlapException extends DomainException {
  readonly statusCode = HttpStatus.CONFLICT;

  constructor(message: string = ERRORS.APPOINTMENT_OVERLAP) {
    super(message);
  }
}
