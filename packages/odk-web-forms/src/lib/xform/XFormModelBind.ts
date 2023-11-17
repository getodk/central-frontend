import type { XFormXPathEvaluator } from '../xpath/XFormXPathEvaluator.ts';
import { getNodesetDependencies } from '../xpath/expression-dependencies.ts';
import type { XFormDataType } from './XFormDataType.ts';
import { bindDataType } from './XFormDataType.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import type { XFormModelDefinition } from './XFormModelDefinition.ts';

type BindExpressionType =
	| 'calculate'
	| 'constraint'
	| 'readonly'
	| 'relevant'
	| 'required'
	| 'saveIncomplete';

interface BindExpressionEvaluationTypes {
	readonly BOOLEAN: boolean;
	readonly STRING: string;
}

export type BindExpressionEvaluationType = keyof BindExpressionEvaluationTypes;

export type BindExpressionEvaluation<Type extends BindExpressionEvaluationType> =
	BindExpressionEvaluationTypes[Type];

export interface BindExpression<Type extends BindExpressionEvaluationType> {
	readonly expression: string | null;
	readonly expressionType: BindExpressionType;
	readonly dependencyExpressions: readonly string[];
	readonly evaluationType: Type;

	evaluate(evaluator: XFormXPathEvaluator, contextNode: Node): BindExpressionEvaluation<Type>;
}

abstract class StaticBindExpression<Type extends BindExpressionEvaluationType>
	implements BindExpression<Type>
{
	readonly expression: string | null;
	readonly dependencyExpressions: readonly string[] = [];

	constructor(
		protected readonly bind: XFormModelBind,
		readonly expressionType: BindExpressionType,
		readonly evaluationType: Type
	) {
		this.expression = bind.bindElement.getAttribute(expressionType);
	}

	protected evaluateBoolean(evaluator: XFormXPathEvaluator, contextNode: Node): boolean {
		const { expression } = this;

		if (expression == null) {
			throw new Error('todo');
		}

		return evaluator.evaluateBoolean(expression, {
			contextNode,
		});
	}

	protected evaluateString(evaluator: XFormXPathEvaluator, contextNode: Node): string {
		const { expression } = this;

		if (expression == null) {
			throw new Error('todo');
		}

		return evaluator.evaluateString(expression, {
			contextNode,
		});
	}

	abstract evaluate(
		evaluator: XFormXPathEvaluator,
		contextNode: Node
	): BindExpressionEvaluation<Type>;

	toJSON() {
		const { bind, ...rest } = this;

		return rest;
	}

	toString() {
		return this.expression;
	}
}

class StaticBooleanBindExpression extends StaticBindExpression<'BOOLEAN'> {
	constructor(bind: XFormModelBind, expressionType: BindExpressionType) {
		super(bind, expressionType, 'BOOLEAN');
	}

	override evaluate(evaluator: XFormXPathEvaluator, contextNode: Node): boolean {
		return this.evaluateBoolean(evaluator, contextNode);
	}
}

abstract class DependentBindExpression<
	Type extends BindExpressionEvaluationType,
> extends StaticBindExpression<Type> {
	override readonly dependencyExpressions: readonly string[];

	constructor(bind: XFormModelBind, expressionType: BindExpressionType, evaluationType: Type) {
		super(bind, expressionType, evaluationType);

		const { expression } = this;
		const dependencyExpressions: string[] = [];

		if (expression != null) {
			dependencyExpressions.push(
				...getNodesetDependencies(expression, {
					contextExpression: bind.nodeset,
				})
			);
		}

		const { parentNodeset } = bind;

		if (expressionType === 'relevant' && parentNodeset != null) {
			dependencyExpressions.push(parentNodeset);
		}

		this.dependencyExpressions = dependencyExpressions;
	}
}

class DependentBooleanBindExpression extends DependentBindExpression<'BOOLEAN'> {
	constructor(bind: XFormModelBind, expressionType: BindExpressionType) {
		super(bind, expressionType, 'BOOLEAN');
	}

	override evaluate(evaluator: XFormXPathEvaluator, contextNode: Node): boolean {
		return this.evaluateBoolean(evaluator, contextNode);
	}
}

class DependentStringBindExpression extends DependentBindExpression<'STRING'> {
	constructor(bind: XFormModelBind, expressionType: BindExpressionType) {
		super(bind, expressionType, 'STRING');
	}

	override evaluate(evaluator: XFormXPathEvaluator, contextNode: Node): string {
		return this.evaluateString(evaluator, contextNode);
	}
}

export type BindNodeset = string;

export interface BindElement {
	getAttribute(name: 'nodeset'): BindNodeset;
	getAttribute(name: string): string | null;
}

export class XFormModelBind {
	readonly bindType: string | null;
	readonly dataType: XFormDataType;
	readonly parentNodeset: string | null;

	readonly calculate: DependentStringBindExpression;
	readonly readonly: DependentBooleanBindExpression;
	readonly relevant: DependentBooleanBindExpression;
	readonly required: DependentBooleanBindExpression;

	readonly nodesetDependencies: readonly string[];

	// According to https://github.com/getodk/javarosa/blob/059321160e6f8dbb3e81d9add61d68dd35b13cc8/dag.md
	// this is not stored in the DAG.
	// TODO: while it certainly makes sense to exclude *self-references* from the DAG
	// it isn't clear whether the expression should be entirely excluded, as other
	// dependencies in the expression may update. Presumably this is resolved by
	// deferring final constraint validation until submission time or some other
	// event which triggers a more thorough recomputation, but I don't believe that
	// is strictly necessary (nor necessarily a significant performance concern).
	readonly constraint: StaticBooleanBindExpression;

	// TODO: it is unclear whether this will need to be supported.
	// https://github.com/getodk/collect/issues/3758 mentions deprecation.
	readonly saveIncomplete: StaticBooleanBindExpression;

	// TODO: these are deferred just to put off sharing namespace stuff
	// readonly requiredMsg: string | null;
	// readonly constraintMsg: string | null;
	// readonly preload: string | null;
	// readonly preloadParams: string | null;
	// readonly 'max-pixels': string | null;

	protected _parentBind: XFormModelBind | null | undefined;

	get parentBind(): XFormModelBind | null {
		let bind = this._parentBind;

		if (typeof bind === 'undefined') {
			const { parentNodeset } = this;

			if (parentNodeset == null) {
				bind = null;
			} else {
				bind = this.form.model.binds.get(parentNodeset) ?? null;
			}

			this._parentBind = bind;
		}

		return bind;
	}

	constructor(
		readonly form: XFormDefinition,
		protected readonly model: XFormModelDefinition,
		readonly nodeset: string,
		readonly bindElement: BindElement
	) {
		const bindType = (this.bindType = bindElement.getAttribute('type'));

		this.dataType = bindDataType(bindType);

		const parentNodeset = nodeset.replace(/\/[^/]+$/, '');

		this.parentNodeset = parentNodeset.length > 1 ? parentNodeset : null;

		const calculate = new DependentStringBindExpression(this, 'calculate');
		const readonly = new DependentBooleanBindExpression(this, 'readonly');
		const relevant = new DependentBooleanBindExpression(this, 'relevant');
		const required = new DependentBooleanBindExpression(this, 'required');

		this.calculate = calculate;
		this.readonly = readonly;
		this.relevant = relevant;
		this.required = required;

		this.nodesetDependencies = Array.from(
			new Set(
				[calculate, readonly, relevant, required].flatMap(
					({ dependencyExpressions }) => dependencyExpressions
				)
			)
		);

		this.constraint = new StaticBooleanBindExpression(this, 'constraint');
		this.saveIncomplete = new StaticBooleanBindExpression(this, 'saveIncomplete');
		// this.requiredMsg = bindElement.getAttributeNS(...)
		// this.constraintMsg = bindElement.getAttributeNS(...)
		// this.preload = bindElement.getAttributeNS(...)
		// this.preloadParams = bindElement.getAttributeNS(...)
		// this['max-pixels'] = bindElement.getAttributeNS(...)
	}

	toJSON() {
		const { form, model, /* modelElement, */ bindElement, ...rest } = this;

		return rest;
	}
}
