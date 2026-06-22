import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { VALIDATION } from '@/common/constants/messages';

export interface FutureDateOptions {
  minMinutes?: number; // antelación mínima (ej. 60 = 1 hora)
  maxMonths?: number; // horizonte máximo (ej. 6 meses)
}

@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const date = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(date.getTime())) return false;

    const [opts = {}] = args.constraints as [FutureDateOptions?];
    const now = Date.now();

    // Debe ser estrictamente futura (epoch = UTC, sin ambigüedad de zona horaria)
    if (date.getTime() <= now) return false;

    // Antelación mínima
    if (opts.minMinutes) {
      const limit = new Date();
      limit.setMinutes(limit.getMinutes() + opts.minMinutes);
      if (date.getTime() < limit.getTime()) return false;
    }

    // Horizonte máximo
    if (opts.maxMonths) {
      const limit = new Date();
      limit.setMonth(limit.getMonth() + opts.maxMonths);
      if (date.getTime() > limit.getTime()) return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const [opts = {}] = args.constraints as [FutureDateOptions?];
    return VALIDATION.DATE_FUTURE_WINDOW(opts);
  }
}

export function IsFutureDate(
  maxMonths?: number,
  minMinutes?: number,
  options?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName,
      constraints: [{ maxMonths, minMinutes }],
      options,
      validator: IsFutureDateConstraint,
    });
  };
}
