// TODO: consider general improvements to `FunctionImplementation` API (and derivatives)
// - Are there cases where `context` is used for anything other than the argument to `evaluate`?
//    - YES? Is there a reasonable way to provide an abstraction that would make that unnecessary?, because...
//    - NO? Consider a "lazy expression" argument interface, e.g. where:
//       - Context is automatically passed, so function implementations don't need to fuss with it
//       - De-lazying is performed by either deref (e.g. `evaluate()`, `toBoolean()` etc) or returning value
// - Type hints -> anything?
// - TS types for arity -> expression nullishness?

import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import type { EvaluationType, PrimitiveEvaluationType } from '../../evaluations/EvaluationType.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';

export class UnknownFunctionError extends Error {
	constructor(functionName: string) {
		super(`Unknown function ${functionName}`);
	}
}

export class InvalidArgumentError extends Error {
	constructor(argumentIndex: number, parameter: Parameter | null) {
		if (parameter == null) {
			super(`Argument ${argumentIndex} not allowed`);
		} else {
			const { typeHint } = parameter;

			const causeMessage =
				typeHint == null
					? `Expected argument at index ${argumentIndex}`
					: `Expected argument compatible with type ${typeHint} at index ${argumentIndex}`;

			super(`Invalid argument at index: ${argumentIndex}`, {
				cause: new Error(causeMessage),
			});
		}
	}
}

export type ParameterArityType = 'optional' | 'required' | 'variadic';

export type ParameterTypeHint =
	// | 'lazy' // TODO: it might be good to *explicitly* mark certain parameters
	// as lazy? This would allow call-site optimizations that would
	// be more challenging or fussy to implement in the individual
	// `FunctionImplementation`.
	| 'any' // TODO: naming? Could be 'unknown' or 'result' or...?
	| 'boolean'
	| 'node'
	| 'number'
	| 'string';

export interface Parameter {
	readonly arityType: ParameterArityType;
	readonly typeHint?: ParameterTypeHint;
}

// TODO: this is the parameter signature, what about return? (partly addressed by `TypedFunction`)
// TODO: is it possible to enforce order? I.e.:
// [...RequiredParameter, ...OptionalParameter, ...([] | [VariadicParameter])]
export type FunctionSignature = readonly Parameter[];

// prettier-ignore
export type ArgumentEvaluation<T extends XPathNode> =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	| Evaluation<any, PrimitiveEvaluationType>
	| Evaluation<T, EvaluationType>;

// prettier-ignore
export interface EvaluableArgument {
	evaluate<T extends XPathNode>(context: EvaluationContext<T>): ArgumentEvaluation<T>;
}

// prettier-ignore
type ValidArguments<Arguments extends readonly EvaluableArgument[], IsValid> =
	[true] extends [IsValid]
		? Arguments
		: never;

interface FunctionArity {
	readonly min: number;
	readonly max: number;
}

export type FunctionCallable = <
	T extends XPathNode,
	Arguments extends readonly EvaluableArgument[],
>(
	context: LocationPathEvaluation<T>,
	args: Arguments
) => Evaluation<T>;

export class FunctionImplementation {
	readonly arity: FunctionArity;
	protected readonly callable: FunctionCallable;

	constructor(
		readonly localName: string,
		readonly signature: FunctionSignature,
		runtimeImplementation: FunctionCallable | FunctionImplementation
	) {
		// TODO: *validate signature order!*
		const arity = [...signature].reduce(
			(acc, parameter) => {
				const { arityType } = parameter;

				switch (arityType) {
					case 'required':
						return {
							min: acc.min + 1,
							max: acc.max + 1,
						};

					case 'optional':
						return {
							min: acc.min,
							max: acc.max + 1,
						};

					case 'variadic':
						return {
							min: acc.min,
							max: Infinity,
						};

					default:
						throw new UnreachableError(arityType);
				}
			},
			{
				min: 0,
				max: 0,
			}
		);

		this.arity = arity;
		this.callable =
			runtimeImplementation instanceof FunctionImplementation
				? runtimeImplementation.callable
				: runtimeImplementation;
	}

	call<T extends XPathNode, Args extends readonly EvaluableArgument[]>(
		context: LocationPathEvaluation<T>,
		args: Args
	): Evaluation<T> {
		this.validateArguments<Args>(args);

		return this.callable(context, args);
	}

	protected validateArguments<Arguments extends readonly EvaluableArgument[]>(
		args: Arguments
	): asserts args is ValidArguments<Arguments, true> {
		const { arity, signature } = this;
		const { min, max } = arity;
		const { length: argumentCount } = args;

		if (argumentCount < min) {
			throw new InvalidArgumentError(min, null);
		}

		if (argumentCount > max) {
			throw new InvalidArgumentError(max, null);
		}

		for (const [index, parameter] of signature.entries()) {
			// TODO: `typeHint` checking...
			if (parameter.arityType !== 'required') {
				break;
			}

			if (args[index] == null) {
				throw new InvalidArgumentError(index, parameter);
			}
		}
	}
}
