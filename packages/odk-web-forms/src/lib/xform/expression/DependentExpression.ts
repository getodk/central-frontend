import type { XFormsXPathEvaluator } from '@odk/xpath';
import { getNodesetDependencies, isItextFunctionCalled } from '../../xpath/analysis.ts';
import type { DependencyContext } from './DependencyContext.ts';

const evaluatorMethodsByResultType = {
	boolean: 'evaluateBoolean',
	nodes: 'evaluateNodes',
	string: 'evaluateString',
} as const;

type EvaluatorMethodsByResultType = typeof evaluatorMethodsByResultType;

export type DependentExpressionResultType = keyof EvaluatorMethodsByResultType;

export type DependentExpressionEvaluatorMethod<Type extends DependentExpressionResultType> =
	EvaluatorMethodsByResultType[Type];

export type DependentExpressionResult<Type extends DependentExpressionResultType> = ReturnType<
	XFormsXPathEvaluator[DependentExpressionEvaluatorMethod<Type>]
>;

interface SemanticDependencyOptions {
	/**
	 * @default false
	 */
	readonly parentContext?: boolean | undefined;

	/**
	 * @default false
	 */
	readonly translations?: boolean | undefined;
}

interface DependentExpressionOptions {
	/**
	 * @default false
	 */
	readonly ignoreContextReference?: boolean;

	/**
	 * @default true
	 */
	readonly ignoreNullExpressions?: boolean;

	readonly semanticDependencies?: SemanticDependencyOptions;
}

export class DependentExpression<Type extends DependentExpressionResultType> {
	readonly dependencyReferences: ReadonlySet<string> = new Set();
	readonly isTranslated: boolean = false;
	readonly evaluatorMethod: DependentExpressionEvaluatorMethod<Type>;

	constructor(
		context: DependencyContext,
		readonly resultType: Type,
		readonly expression: string,
		options: DependentExpressionOptions = {}
	) {
		this.evaluatorMethod = evaluatorMethodsByResultType[resultType];

		const {
			ignoreContextReference = false,
			ignoreNullExpressions = true,
			semanticDependencies = {
				parentContext: false,
				translations: false,
			},
		} = options;

		const dependencyReferences = new Set<string>(
			getNodesetDependencies(expression, {
				contextReference: context.reference,
				ignoreContextReference,
				ignoreNullExpressions,
			})
		);

		const parentDependency = semanticDependencies.parentContext ? context.parentReference : null;

		if (parentDependency != null) {
			dependencyReferences.add(parentDependency);
		}

		this.dependencyReferences = dependencyReferences;

		const isTranslated = semanticDependencies.translations && isItextFunctionCalled(expression);

		if (isTranslated) {
			this.isTranslated = true;
			context.isTranslated = true;
		}

		context.registerDependentExpression(this);
	}

	toString(): string | null {
		return this.expression;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDependentExpression = DependentExpression<any>;
