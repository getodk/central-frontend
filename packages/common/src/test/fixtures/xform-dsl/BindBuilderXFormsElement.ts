import { EmptyXFormsElement } from './EmptyXFormsElement.ts';
import type { XFormsElement } from './XFormsElement.ts';

class BindBuilderXFormsElement implements XFormsElement {
	protected readonly name = 'bind';
	protected readonly attributes: ReadonlyMap<string, string>;
	protected readonly bindAttributes: Map<string, string>;

	constructor(readonly nodeset: string) {
		const bindAttributes = new Map<string, string>([['nodeset', nodeset]]);

		this.bindAttributes = bindAttributes;
		this.attributes = bindAttributes;
	}

	getName(): string {
		return this.name;
	}

	asXml(): string {
		return new EmptyXFormsElement('bind', this.attributes).asXml();
	}

	getNodeset(): string {
		return this.attributes.get('nodeset') ?? '';
	}

	type(type: string): BindBuilderXFormsElement {
		this.bindAttributes.set('type', type);

		return this;
	}

	constraint(expression: string): BindBuilderXFormsElement {
		this.bindAttributes.set('constraint', expression);

		return this;
	}

	required(expression = 'true()'): BindBuilderXFormsElement {
		this.bindAttributes.set('required', expression);

		return this;
	}

	relevant(expression: string): BindBuilderXFormsElement {
		this.bindAttributes.set('relevant', expression);

		return this;
	}

	calculate(expression: string): BindBuilderXFormsElement {
		this.bindAttributes.set('calculate', expression);

		return this;
	}

	preload(expression: string): BindBuilderXFormsElement {
		this.bindAttributes.set('jr:preload', expression);

		return this;
	}

	readonly(expression = 'true()'): BindBuilderXFormsElement {
		this.bindAttributes.set('readonly', expression);

		return this;
	}

	withAttribute(namespace: string, name: string, expression: string): BindBuilderXFormsElement {
		this.bindAttributes.set(`${namespace}:${name}`, expression);

		return this;
	}
}

export type { BindBuilderXFormsElement };

export const bind = (nodeset: string): BindBuilderXFormsElement => {
	return new BindBuilderXFormsElement(nodeset);
};
