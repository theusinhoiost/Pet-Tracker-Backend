import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (!value) return false;
          if (
            typeof value !== 'string' &&
            typeof value !== 'number' &&
            !(value instanceof Date)
          ) {
            return false;
          }
          const date = new Date(value);
          if (isNaN(date.getTime())) return false;

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          date.setHours(0, 0, 0, 0);
          return date <= today;
        },
        defaultMessage: () => 'Data não pode ser no futuro!',
      },
    });
  };
}
