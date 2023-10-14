import { StringEvaluation } from '../../evaluations/StringEvaluation.ts';
import type {
  FunctionImplementationOptions,
  FunctionSignature,
} from './FunctionImplementation.ts';
import type { TypedFunctionCallable } from './TypedFunctionImplementation.ts';
import { TypedFunctionImplementation } from './TypedFunctionImplementation.ts';

export class StringFunction<
  Length extends number
> extends TypedFunctionImplementation<string, Length> {
  constructor(
    signature: FunctionSignature<Length>,
    call: TypedFunctionCallable<string>,
    options?: FunctionImplementationOptions
  ) {
    super(StringEvaluation, signature, call, options);
  }
}
