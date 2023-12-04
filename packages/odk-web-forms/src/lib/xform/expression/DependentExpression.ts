import { getNodesetDependencies, isItextFunctionCalled } from '../../xpath/analysis.ts';
import type { DependencyContext } from './DependencyContext.ts';

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

export class DependentExpression {
	readonly dependencyReferences: ReadonlySet<string> = new Set();
	readonly isTranslated: boolean = false;

	constructor(
		context: DependencyContext,
		readonly expression: string,
		options: DependentExpressionOptions = {}
	) {
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
