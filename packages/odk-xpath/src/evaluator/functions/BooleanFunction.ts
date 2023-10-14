import { BooleanEvaluation } from '../../evaluations/BooleanEvaluation.ts';
import type {
  FunctionImplementationOptions,
  FunctionSignature,
} from './FunctionImplementation.ts';
import type { TypedFunctionCallable } from './TypedFunctionImplementation.ts';
import { TypedFunctionImplementation } from './TypedFunctionImplementation.ts';

export class BooleanFunction<
  Length extends number
> extends TypedFunctionImplementation<boolean, Length> {
  constructor(
    signature: FunctionSignature<Length>,
    call: TypedFunctionCallable<boolean>,
    options?: FunctionImplementationOptions
  ) {
    super(BooleanEvaluation, signature, call, options);
  }
}
