import { RepeatGroupDefinition } from '../body/group/RepeatGroupDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { NodeDefinition, ParentNodeDefinition } from './NodeDefinition.ts';
import { RepeatInstanceDefinition } from './RepeatInstanceDefinition.ts';
import { RepeatTemplateDefinition } from './RepeatTemplateDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';

export class RepeatSequenceDefinition implements NodeDefinition<'repeat-sequence'> {
	// TODO: if an implicit template is derived from an instance in a form
	// definition, should its default values (if any) be cleared? Probably!
	static createTemplateElement(instanceElement: Element): Element {
		return instanceElement.cloneNode(true) as Element;
	}

	static createInstanceElement(templateElement: Element): Element {
		return templateElement.cloneNode(true) as Element;
	}

	readonly type = 'repeat-sequence';

	readonly root: RootDefinition;
	readonly template: RepeatTemplateDefinition;
	readonly children = null;
	readonly instances: RepeatInstanceDefinition[];

	readonly node = null;
	readonly nodeName: string;
	readonly defaultValue = null;

	constructor(
		readonly parent: ParentNodeDefinition,
		readonly bind: BindDefinition,
		readonly bodyElement: RepeatGroupDefinition,
		modelNodes: readonly [Element, ...Element[]]
	) {
		const { root } = parent;

		this.root = root;
		this.bind = bind;

		const { template, instanceNodes } = RepeatTemplateDefinition.parseModelNodes(this, modelNodes);

		this.template = template;
		this.nodeName = template.nodeName;
		this.instances = instanceNodes.map((element) => {
			return new RepeatInstanceDefinition(this, element);
		});
	}

	toJSON() {
		const { bind, bodyElement: groupDefinition, parent, root, ...rest } = this;

		return rest;
	}
}
