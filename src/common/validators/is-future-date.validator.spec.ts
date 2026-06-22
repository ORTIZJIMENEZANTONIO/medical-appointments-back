import { ValidationArguments } from 'class-validator';
import {
  FutureDateOptions,
  IsFutureDateConstraint,
} from './is-future-date.validator';

/**
 * Unit — valida la lógica pura del validador de fecha futura.
 * Cubre (a nivel unitario): CIT-04 (pasada), CIT-05 (antelación), CIT-06 (horizonte), CIT-07 (inválida).
 */
describe('IsFutureDateConstraint (unit)', () => {
  const constraint = new IsFutureDateConstraint();

  const argsWith = (opts: FutureDateOptions): ValidationArguments =>
    ({
      constraints: [opts],
      value: undefined,
      targetName: 'CreateAppointmentDto',
      object: {},
      property: 'appointmentDate',
    }) as ValidationArguments;

  const inMinutes = (n: number) => new Date(Date.now() + n * 60_000);

  it('rechaza una fecha pasada', () => {
    expect(constraint.validate(inMinutes(-60), argsWith({}))).toBe(false);
  });

  it('acepta una fecha futura sin restricciones', () => {
    expect(constraint.validate(inMinutes(120), argsWith({}))).toBe(true);
  });

  it('rechaza valores que no son fecha válida', () => {
    expect(constraint.validate(new Date('invalid'), argsWith({}))).toBe(false);
    expect(constraint.validate('no-es-fecha', argsWith({}))).toBe(false);
  });

  it('rechaza si no cumple la antelación mínima', () => {
    expect(constraint.validate(inMinutes(30), argsWith({ minMinutes: 60 }))).toBe(
      false,
    );
  });

  it('acepta si cumple la antelación mínima', () => {
    expect(constraint.validate(inMinutes(90), argsWith({ minMinutes: 60 }))).toBe(
      true,
    );
  });

  it('rechaza si excede el horizonte máximo', () => {
    const sevenMonths = new Date();
    sevenMonths.setMonth(sevenMonths.getMonth() + 7);
    expect(constraint.validate(sevenMonths, argsWith({ maxMonths: 6 }))).toBe(
      false,
    );
  });

  it('acepta dentro del horizonte máximo', () => {
    const oneMonth = new Date();
    oneMonth.setMonth(oneMonth.getMonth() + 1);
    expect(constraint.validate(oneMonth, argsWith({ maxMonths: 6 }))).toBe(true);
  });
});
