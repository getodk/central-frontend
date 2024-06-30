import type { XFormDataType } from '../XFormDataType.ts';
import { bindDataType } from '../XFormDataType.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import { DependencyContext } from '../expression/DependencyContext.ts';
import type { DependentExpression } from '../expression/DependentExpression.ts';
import { MessageDefinition } from '../parse/text/MessageDefinition.ts';
import { BindComputation } from './BindComputation.ts';
import type { BindElement } from './BindElement.ts';
import type { ModelDefinition } from './ModelDefinition.ts';

export class BindDefinition extends DependencyContext {
	readonly bindType: string | null;
	readonly dataType: XFormDataType;
	readonly parentNodeset: string | null;

	readonly calculate: BindComputation<'calculate'> | null;
	readonly readonly: BindComputation<'readonly'>;
	readonly relevant: BindComputation<'relevant'>;
	readonly required: BindComputation<'required'>;

	// According to
	//
	// this is not stored in the DAG. In contrast, we do compute constraint
	// dependencies, but self-references are ignored (handled by `BindComputation`
	// and its `DependentExpression` parent class).
	/**
	 * Diverges from {@link https://github.com/getodk/javarosa/blob/059321160e6f8dbb3e81d9add61d68dd35b13cc8/dag.md | JavaRosa's}, which excludes `constraint` expressions. We compute `constraint` dependencies like the other <bind> computation expressions, but explicitly ignore self-references (this is currently handled by {@link BindComputation}, via its {@link DependentExpression} parent class).
	 */
	readonly constraint: BindComputation<'constraint'>;

	readonly constraintMsg: MessageDefinition<'constraintMsg'> | null;
	readonly requiredMsg: MessageDefinition<'requiredMsg'> | null;

	// TODO: it is unclear whether this will need to be supported.
	// https://github.com/getodk/collect/issues/3758 mentions deprecation.
	readonly saveIncomplete: BindComputation<'saveIncomplete'>;

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

		const bindType = (this.bindType = bindElement.getAttribute('type'));

		this.dataType = bindDataType(bindType);

		const parentNodeset = nodeset.replace(/\/[^/]+$/, '');

		this.parentNodeset = parentNodeset.length > 1 ? parentNodeset : null;
		this.calculate = BindComputation.forExpression(this, 'calculate');
		this.readonly = BindComputation.forExpression(this, 'readonly');
		this.relevant = BindComputation.forExpression(this, 'relevant');
		this.required = BindComputation.forExpression(this, 'required');
		this.constraint = BindComputation.forExpression(this, 'constraint');
		this.saveIncomplete = BindComputation.forExpression(this, 'saveIncomplete');
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
