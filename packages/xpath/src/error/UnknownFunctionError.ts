import { FormDesignError } from './FormDesignError';

export class UnknownFunctionError extends FormDesignError {
  constructor(functionName: string) {
    super(`Unknown function in form definition: "${functionName}"`);
  }
}
