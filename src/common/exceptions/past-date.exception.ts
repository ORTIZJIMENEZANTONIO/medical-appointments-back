import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class PastDateException extends DomainException {
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(
    public readonly message: string = 'La cita debe ser en una fecha y hora futura',
  ) {
    super(message);
  }
}
