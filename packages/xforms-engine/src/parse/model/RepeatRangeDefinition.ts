import { NamespaceDeclarationMap } from '../../lib/names/NamespaceDeclarationMap.ts';
import { QualifiedName } from '../../lib/names/QualifiedName.ts';
import type { RepeatElementDefinition } from '../body/RepeatElementDefinition.ts';
import { RepeatCountControlExpression } from '../expression/RepeatCountControlExpression.ts';
import type { BindDefinition } from './BindDefinition.ts';
import { DescendentNodeDefinition } from './DescendentNodeDefinition.ts';
import type { ParentNodeDefinition } from './NodeDefinition.ts';
import { RepeatInstanceDefinition } from './RepeatInstanceDefinition.ts';
import { RepeatTemplateDefinition } from './RepeatTemplateDefinition.ts';

export interface ControlledRepeatRangeDefinition extends RepeatRangeDefinition {
	readonly count: RepeatCountControlExpression;
}

export interface UncontrolledRepeatRangeDefinition extends RepeatRangeDefinition {
	readonly count: null;
}

// prettier-ignore
export type AnyRepeatRangeDefinition =
	| ControlledRepeatRangeDefinition
	| UncontrolledRepeatRangeDefinition;

type AssertRepeatRangeDefinitionUnion = (
	definition: RepeatRangeDefinition
) => asserts definition is AnyRepeatRangeDefinition;

const assertRepeatRangeDefinitionUnion: AssertRepeatRangeDefinitionUnion = (_definition) => {
	// Intentional no-op, used to guide the type checker. Implementation would
	// check _definition.count == null || _definition.count != null, which is
	// tautologically true!
};

export class RepeatRangeDefinition extends DescendentNodeDefinition<
	'repeat-range',
	RepeatElementDefinition
> {
	static from(
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		bodyElement: RepeatElementDefinition,
		modelNodes: readonly [Element, ...Element[]]
	): AnyRepeatRangeDefinition {
		const definition = new this(parent, bind, bodyElement, modelNodes);

		assertRepeatRangeDefinitionUnion(definition);

		return definition;
	}

	readonly type = 'repeat-range';

	readonly template: RepeatTemplateDefinition;
	readonly children = null;
	readonly instances: RepeatInstanceDefinition[];
	readonly count: RepeatCountControlExpression | null;

	readonly node = null;
	readonly namespaceDeclarations: NamespaceDeclarationMap;
	readonly qualifiedName: QualifiedName;
	readonly defaultValue = null;

	private constructor(
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		bodyElement: RepeatElementDefinition,
		modelNodes: readonly [Element, ...Element[]]
	) {
		super(parent, bind, bodyElement);

		const { template, instanceNodes } = RepeatTemplateDefinition.parseModelNodes(this, modelNodes);

		this.template = template;
		this.qualifiedName = template.qualifiedName;
		this.namespaceDeclarations = new NamespaceDeclarationMap(this);
		this.count = RepeatCountControlExpression.from(bodyElement, instanceNodes.length);

		assertRepeatRangeDefinitionUnion(this);

		this.instances = instanceNodes.map((element) => {
			return new RepeatInstanceDefinition(this, element);
		});
	}

	isControlled(): this is ControlledRepeatRangeDefinition {
		return this.count != null;
	}

	isUncontrolled(): this is UncontrolledRepeatRangeDefinition {
		return this.count == null;
	}

	toJSON() {
		const { bind, bodyElement: groupDefinition, parent, root, ...rest } = this;

		return rest;
	}
}
