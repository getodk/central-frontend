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

class BindExpression {
	static from(bind: XFormModelBind, type: BindExpressionType): BindExpression | null {
		const expression = bind.bindElement.getAttribute(type);

		if (expression == null) {
			return null;
		}

		return new this(bind, expression);
	}

	readonly dependencyExpressions: readonly string[] = [];

	protected constructor(
		readonly bind: XFormModelBind,
		readonly expression: string
	) {}

	toJSON() {
		const { bind, ...rest } = this;

		return rest;
	}

	toString() {
		return this.expression;
	}
}

class DependentBindExpression extends BindExpression {
	override readonly dependencyExpressions: readonly string[];

	protected constructor(bind: XFormModelBind, expression: string) {
		super(bind, expression);

		this.dependencyExpressions = getNodesetDependencies(expression, {
			contextExpression: bind.nodeset,
		});
	}
}

export type BindNodeset = string;

export interface BindElement extends Element {
	getAttribute(name: 'nodeset'): BindNodeset;
	getAttribute(name: string): string | null;
}

export class XFormModelBind {
	readonly bindType: string | null;
	readonly dataType: XFormDataType;

	readonly calculate: DependentBindExpression | null;
	readonly readonly: DependentBindExpression | null;
	readonly relevant: DependentBindExpression | null;
	readonly required: DependentBindExpression | null;

	// According to https://github.com/getodk/javarosa/blob/059321160e6f8dbb3e81d9add61d68dd35b13cc8/dag.md
	// this is not stored in the DAG.
	// TODO: while it certainly makes sense to exclude *self-references* from the DAG
	// it isn't clear whether the expression should be entirely excluded, as other
	// dependencies in the expression may update. Presumably this is resolved by
	// deferring final constraint validation until submission time or some other
	// event which triggers a more thorough recomputation, but I don't believe that
	// is strictly necessary (nor necessarily a significant performance concern).
	readonly constraint: BindExpression | null;

	// TODO: it is unclear whether this will need to be supported.
	// https://github.com/getodk/collect/issues/3758 mentions deprecation.
	readonly saveIncomplete: BindExpression | null;

	// TODO: these are deferred just to put off sharing namespace stuff
	// readonly requiredMsg: string | null;
	// readonly constraintMsg: string | null;
	// readonly preload: string | null;
	// readonly preloadParams: string | null;
	// readonly 'max-pixels': string | null;

	constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: XFormModelDefinition,
		readonly nodeset: string,
		readonly bindElement: BindElement
	) {
		const bindType = (this.bindType = bindElement.getAttribute('type'));

		this.dataType = bindDataType(bindType);

		this.calculate = DependentBindExpression.from(this, 'calculate');
		this.readonly = DependentBindExpression.from(this, 'readonly');
		this.relevant = DependentBindExpression.from(this, 'relevant');
		this.required = DependentBindExpression.from(this, 'required');

		this.constraint = BindExpression.from(this, 'constraint');
		this.saveIncomplete = BindExpression.from(this, 'saveIncomplete');
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
