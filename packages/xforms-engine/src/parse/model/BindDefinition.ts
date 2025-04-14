import { DependencyContext } from '../expression/abstract/DependencyContext.ts';
import type { DependentExpression } from '../expression/abstract/DependentExpression.ts';
import { BindComputationExpression } from '../expression/BindComputationExpression.ts';
import { MessageDefinition } from '../text/MessageDefinition.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type { BindElement } from './BindElement.ts';
import { BindPreloadDefinition, type AnyBindPreloadDefinition } from './BindPreloadDefinition.ts';
import type { BindType } from './BindTypeDefinition.ts';
import { BindTypeDefinition } from './BindTypeDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';

export class BindDefinition<T extends BindType = BindType> extends DependencyContext {
	readonly type: BindTypeDefinition<T>;
	readonly parentNodeset: string | null;

	readonly preload: AnyBindPreloadDefinition | null;

	readonly calculate: BindComputationExpression<'calculate'> | null;
	readonly readonly: BindComputationExpression<'readonly'>;
	readonly relevant: BindComputationExpression<'relevant'>;
	readonly required: BindComputationExpression<'required'>;

	/**
	 * Diverges from
	 * {@link https://github.com/getodk/javarosa/blob/059321160e6f8dbb3e81d9add61d68dd35b13cc8/dag.md | JavaRosa's},
	 * which excludes `constraint` expressions. We compute `constraint`
	 * dependencies like the other <bind> computation expressions, but explicitly
	 * ignore self-references (this is currently handled by
	 * {@link BindComputationExpression}, via its {@link DependentExpression}
	 * super class).
	 */
	readonly constraint: BindComputationExpression<'constraint'>;

	readonly constraintMsg: MessageDefinition<'constraintMsg'> | null;
	readonly requiredMsg: MessageDefinition<'requiredMsg'> | null;

	// TODO: it is unclear whether this will need to be supported.
	// https://github.com/getodk/collect/issues/3758 mentions deprecation.
	readonly saveIncomplete: BindComputationExpression<'saveIncomplete'>;

	// TODO: these are deferred until prioritized
	// readonly preload: string | null;
	// readonly preloadParams: string | null;
	// readonly 'max-pixels': string | null;

	protected _parentBind: BindDefinition | null | undefined;

	get parentBind(): BindDefinition | null {
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

	// DependencyContext
	get reference(): string {
		return this.nodeset;
	}

	get parentReference(): string | null {
		return this.parentNodeset;
	}

	constructor(
		readonly form: XFormDefinition,
		protected readonly model: ModelDefinition,
		readonly nodeset: string,
		readonly bindElement: BindElement
	) {
		super();

		this.type = BindTypeDefinition.from(form, nodeset, bindElement);

		const parentNodeset = nodeset.replace(/\/[^/]+$/, '');

		this.parentNodeset = parentNodeset.length > 1 ? parentNodeset : null;
		this.preload = BindPreloadDefinition.from(bindElement);
		this.calculate = BindComputationExpression.forComputation(this, 'calculate');
		this.readonly = BindComputationExpression.forComputation(this, 'readonly');
		this.relevant = BindComputationExpression.forComputation(this, 'relevant');
		this.required = BindComputationExpression.forComputation(this, 'required');
		this.constraint = BindComputationExpression.forComputation(this, 'constraint');
		this.saveIncomplete = BindComputationExpression.forComputation(this, 'saveIncomplete');
		this.constraintMsg = MessageDefinition.from(this, 'constraintMsg');
		this.requiredMsg = MessageDefinition.from(this, 'requiredMsg');

		// this.preload = BindComputation.forExpression(this, 'preload');
		// this.preloadParams = BindComputation.forExpression(this, 'preloadParams');
		// this['max-pixels'] = BindComputation.forExpression(this, 'max-pixels');
	}

	toJSON() {
		const { form, model, /* modelElement, */ bindElement, ...rest } = this;

		return rest;
	}
}
