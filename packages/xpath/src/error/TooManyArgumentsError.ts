import { FormDesignError } from './FormDesignError';

export class TooManyArgumentsError extends FormDesignError {
  constructor(functionName: string, given: number, expected: number) {
    super(
      `Function "${functionName}" has a maximum of ${expected} parameters but was called with ${given}`
    );
  }
}
