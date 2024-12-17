import type { SyncExpectationResult } from 'vitest';
import type { JSONValue } from '../../../../types/JSONValue.ts';
import type { Primitive } from '../../../../types/Primitive.ts';
import type { ArbitraryConditionExpectExtension } from './ArbitraryConditionExpectExtension.ts';
import type { AsymmetricTypedExpectExtension } from './AsymmetricTypedExpectExtension.ts';
import type { AsyncAsymmetricTypedExpectExtension } from './AsyncAsymmetricTypedExpectExtension.ts';
import type { StaticConditionExpectExtension } from './StaticConditionExpectExtension.ts';
import type { SymmetricTypedExpectExtension } from './SymmetricTypedExpectExtension.ts';

export interface CustomInspectable {
	inspectValue(): JSONValue;
}

export type Inspectable = CustomInspectable | Primitive;

export interface ErrorLike {
	readonly message: string;
}

type Message = string;

/**
 * To simplify assertion extensions, they may return:
 *
 * - `true` if the assertion passes
 * - `Error` expressing the assertion's failure
 */
// eslint-disable-next-line @typescript-eslint/sort-type-constituents
export type SimpleAssertionResult = true | ErrorLike | Message;

export type ExpectExtensionMethod<
	Actual = unknown,
	Expected = Actual,
	Result = SimpleAssertionResult,
> = (actual: Actual, expected: Expected) => Result;

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TypedExpectExtension<Actual = any, Expected = Actual> =
	| AsymmetricTypedExpectExtension<Actual, Expected>
	| AsyncAsymmetricTypedExpectExtension<Actual, Expected>
	| SymmetricTypedExpectExtension<Expected>;

type AsyncUntypedExpectExtensionFunction = ExpectExtensionMethod<
	unknown,
	unknown,
	Promise<SyncExpectationResult>
>;

type SyncUntypedExpectExtensionFunction = ExpectExtensionMethod<
	unknown,
	unknown,
	SyncExpectationResult
>;

// prettier-ignore
export type UntypedExpectExtensionFunction =
	| AsyncUntypedExpectExtensionFunction
	| SyncUntypedExpectExtensionFunction;

export interface UntypedExpectExtensionObject {
	readonly extensionMethod: UntypedExpectExtensionFunction;
}

// prettier-ignore
export type UntypedExpectExtension =
	| UntypedExpectExtensionFunction
	| UntypedExpectExtensionObject;

// prettier-ignore
export type ExpectExtension =
	| TypedExpectExtension
	| UntypedExpectExtension;

export type ExpectExtensionRecord<MethodName extends string> = Readonly<
	Record<MethodName, ExpectExtension>
>;

// prettier-ignore
export type DeriveStaticVitestExpectExtension<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Implementation extends ExpectExtensionRecord<any>,
	VitestParameterizedReturn = unknown
> = {
	[K in keyof Implementation]:
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Implementation[K] extends AsyncAsymmetricTypedExpectExtension<any, infer Expected>
			? (expected: Expected) => Promise<VitestParameterizedReturn>
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		: Implementation[K] extends ArbitraryConditionExpectExtension<any>
			? () => VitestParameterizedReturn
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		: Implementation[K] extends StaticConditionExpectExtension<any, any>
			? () => VitestParameterizedReturn
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		: Implementation[K] extends TypedExpectExtension<any, infer Expected>
			? (expected: Expected) => VitestParameterizedReturn
			: (expected: unknown) => VitestParameterizedReturn;
}
