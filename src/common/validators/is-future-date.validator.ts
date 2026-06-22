import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export interface FutureDateOptions {
  minMinutes?: number; // Opcional: número mínimo de minutos en el futuro
  maxMonths?: number; // Opcional: número máximo de meses en el futuro
}

@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  /* Validación personalizada para fechas futuras no mayores a x fecha y no menores a y tiempo*/
  validate(value: unknown, args: ValidationArguments): boolean {
    const date = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(date.getTime())) return false;

    const [opts = {}] = args.constraints as [FutureDateOptions?];
    const now = Date.now();

    if (date.getTime() <= now) return false;

    const { maxMonths, minMinutes } = opts;

    /* Antelación mínima */
    if (minMinutes) {
      const limit = new Date();
      limit.setMinutes(limit.getMinutes() + minMinutes);
      if (date.getTime() < limit.getTime()) return false;
    }

    //  Validación tope futuro (ej. no más de 6 meses)
    if (maxMonths) {
      const limit = new Date();
      limit.setMonth(limit.getMonth() + maxMonths);
      if (date.getTime() > limit.getTime()) return false;
    }

    return true;
  }
  defaultMessage(args: ValidationArguments): string {
    const [opts = {}] = args.constraints as [FutureDateOptions?];
    const { maxMonths, minMinutes } = opts;
    return maxMonths
      ? `${args.property} debe ser futura y no mayor a ${maxMonths} meses`
      : `${args.property} debe ser una fecha y hora futura`;
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
