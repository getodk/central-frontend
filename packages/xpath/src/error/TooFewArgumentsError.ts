import { FormDesignError } from './FormDesignError';

export class TooFewArgumentsError extends FormDesignError {
  constructor(functionName: string, given: number, expected: number) {
    super(
      `Function "${functionName}" requires a minimum of ${expected} parameters but was called with ${given}`
    );
  }
}
