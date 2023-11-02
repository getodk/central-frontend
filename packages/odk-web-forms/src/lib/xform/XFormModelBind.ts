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
	readonly expression: string | null;
	readonly dependencyExpressions: readonly string[] = [];

	constructor(bind: XFormModelBind, type: BindExpressionType) {
		this.expression = bind.bindElement.getAttribute(type);
	}

	toString() {
		return this.expression;
	}
}

class DependentBindExpression extends BindExpression {
	override readonly dependencyExpressions: readonly string[];

	constructor(bind: XFormModelBind, type: BindExpressionType) {
		super(bind, type);

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

		if (type === 'relevant' && parentNodeset != null) {
			dependencyExpressions.push(parentNodeset);
		}

		this.dependencyExpressions = dependencyExpressions;
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

	// TODO
	// readonly parentBind: XFormModelBind | null;

	readonly calculate: DependentBindExpression;
	readonly readonly: DependentBindExpression;
	readonly relevant: DependentBindExpression;
	readonly required: DependentBindExpression;

	readonly nodesetDependencies: readonly string[];

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

		const parentNodeset = nodeset.replace(/\/[^/]+$/, '');

		this.parentNodeset = parentNodeset.length > 1 ? parentNodeset : null;

		const calculate = (this.calculate = new DependentBindExpression(this, 'calculate'));
		const readonly = (this.readonly = new DependentBindExpression(this, 'readonly'));
		const relevant = (this.relevant = new DependentBindExpression(this, 'relevant'));
		const required = (this.required = new DependentBindExpression(this, 'required'));

		this.nodesetDependencies = Array.from(
			new Set(
				[calculate, readonly, relevant, required].flatMap(
					({ dependencyExpressions }) => dependencyExpressions
				)
			)
		);

		this.constraint = new BindExpression(this, 'constraint');
		this.saveIncomplete = new BindExpression(this, 'saveIncomplete');
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
