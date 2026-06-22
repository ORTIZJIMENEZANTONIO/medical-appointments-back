// ── Mensajes de validación de entrada (DTOs) ────────────────────────────────
export const VALIDATION = {
  NAME_STRING: 'El nombre debe ser una cadena de texto',
  NAME_MAX: 'El nombre no puede tener más de 50 caracteres',

  LASTNAME1_STRING: 'El primer apellido debe ser una cadena de texto',
  LASTNAME1_MAX: 'El primer apellido no puede tener más de 50 caracteres',

  LASTNAME2_STRING: 'El segundo apellido debe ser una cadena de texto',
  LASTNAME2_MAX: 'El segundo apellido no puede tener más de 50 caracteres',

  EMAIL_STRING: 'El correo electrónico debe ser una cadena de texto',
  EMAIL_INVALID: 'El correo electrónico no es válido',
  EMAIL_MAX: 'El correo electrónico no puede tener más de 150 caracteres',

  PHONE_STRING: 'El teléfono debe ser una cadena de texto',
  PHONE_FORMAT: 'El teléfono debe tener exactamente 10 dígitos',

  REASON_STRING: 'El motivo debe ser una cadena de texto',
  REASON_MAX: 'El motivo no puede tener más de 255 caracteres',

  ID_INT: 'El identificador debe ser un número entero',
  ID_POSITIVE: 'El identificador debe ser un número positivo',

  DATE_INVALID: 'La fecha debe estar en formato ISO 8601 válido',
  DATE_FUTURE: 'La cita debe ser en una fecha y hora futura',
  DATE_RANGE_ISO: 'La fecha debe estar en formato ISO 8601',
  STATUS_INVALID: 'El estado debe ser 1 (ACTIVE) o 2 (CANCELLED)',

  // Mensaje dinámico para el validador de fecha (antelación mínima / horizonte máximo)
  DATE_FUTURE_WINDOW: (opts: {
    minMinutes?: number;
    maxMonths?: number;
  }): string => {
    let msg = 'La cita debe ser en una fecha y hora futura';
    if (opts.minMinutes) {
      msg += `, con al menos ${opts.minMinutes} minutos de anticipación`;
    }
    if (opts.maxMonths) {
      msg += `, y no más de ${opts.maxMonths} meses adelante`;
    }
    return msg;
  },
};

// ── Mensajes de error de negocio / HTTP (respuesta al cliente) ──────────────
export const ERRORS = {
  DOCTOR_NOT_FOUND: 'El doctor solicitado no existe',
  PATIENT_NOT_FOUND: 'El paciente solicitado no existe',
  APPOINTMENT_NOT_FOUND: 'La cita solicitada no existe',

  // Anti-enumeración: genérico, sin reflejar el email del usuario.
  EMAIL_ALREADY_REGISTERED: 'El correo electrónico ya está registrado',

  APPOINTMENT_OVERLAP:
    'El doctor ya tiene una cita activa que se traslapa con ese horario',
  APPOINTMENT_ALREADY_CANCELLED: 'La cita ya está cancelada',

  // 5xx: nunca se expone el detalle interno al cliente (se loguea aparte).
  INTERNAL: 'Error interno del servidor',
};
