import type { Evaluation } from '../../evaluations/Evaluation';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type { Expression } from '../expression/Expression.ts';
import type {
  FunctionImplementationOptions,
  FunctionSignature,
} from './FunctionImplementation.ts';
import { FunctionImplementation } from './FunctionImplementation.ts';

export type TypedFunctionCallable<Type> = <Arguments extends readonly Expression[]>(
  context: LocationPathEvaluation,
  args: Arguments
) => Type;

export class TypedFunctionImplementation<
  Type,
  Length extends number
> extends FunctionImplementation<Length> {
  protected constructor(
    TypedResult: new (value: Type) => Evaluation,
    signature: FunctionSignature<Length>,
    call: TypedFunctionCallable<Type>,
    options?: FunctionImplementationOptions
  ) {
    super(signature, (
      context: LocationPathEvaluation,
      args: readonly Expression[]
    ) => {
      const runtimeResult = call(context, args);

      return new TypedResult(runtimeResult);
    }, options);
  }
}
