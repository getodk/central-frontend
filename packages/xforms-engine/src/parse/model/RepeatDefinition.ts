import { JAVAROSA_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { XFORMS_KNOWN_ATTRIBUTE } from '@getodk/xpath';
import type { RepeatRange } from '../../instance/hierarchy.ts';
import type { PrimaryInstance } from '../../instance/PrimaryInstance.ts';
import type { RepeatInstance } from '../../instance/repeat/RepeatInstance.ts';
import type {
	StaticAttribute,
	StaticAttributeOptions,
} from '../../integration/xpath/static-dom/StaticAttribute.ts';
import { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type {
	StaticElement,
	StaticElementOptions,
} from '../../integration/xpath/static-dom/StaticElement.ts';
import type { StaticNode } from '../../integration/xpath/static-dom/StaticNode.ts';
import type { StaticText } from '../../integration/xpath/static-dom/StaticText.ts';
import { NamespaceDeclarationMap } from '../../lib/names/NamespaceDeclarationMap.ts';
import type { NamespaceURL } from '../../lib/names/NamespaceURL.ts';
import type { QualifiedName, QualifiedNameSource } from '../../lib/names/QualifiedName.ts';
import type { RepeatElementDefinition } from '../body/RepeatElementDefinition.ts';
import { RepeatCountControlExpression } from '../expression/RepeatCountControlExpression.ts';
import type { BindDefinition } from './BindDefinition.ts';
import { DescendentNodeDefinition } from './DescendentNodeDefinition.ts';
import type { ChildNodeDefinition, ParentNodeDefinition } from './NodeDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';
import type { SubtreeDefinition } from './SubtreeDefinition.ts';

interface JavaRosaNamespaceURI extends NamespaceURL {
	readonly href: JAVAROSA_NAMESPACE_URI;
}

interface JRTemplateAttributeName extends QualifiedName {
	readonly namespaceURI: JavaRosaNamespaceURI;
	readonly localName: 'template';
}

const isJRTemplateAttributeName = (name: QualifiedNameSource) => {
	if (name.localName !== 'template') {
		return false;
	}

	const namespaceURI = (name.namespaceURI as NamespaceURL)?.href ?? name.namespaceURI;

	return namespaceURI === JAVAROSA_NAMESPACE_URI;
};

interface JRTemplateAttribute extends StaticAttribute {
	readonly qualifiedName: JRTemplateAttributeName;
}

const isJRTemplateAttribute = (attribute: StaticAttribute): attribute is JRTemplateAttribute => {
	return isJRTemplateAttributeName(attribute.qualifiedName);
};

interface ExplicitRepeatTemplateElement extends StaticElement {
	readonly [XFORMS_KNOWN_ATTRIBUTE]: 'template';

	getAttributeValue(localName: 'template'): string;
	getAttributeValue(localName: string): string | null;
}

/**
 * Determines whether a model instance node is an **explicit** repeat template,
 * as defined by the presence of a `jr:template` attribute on that node.
 *
 * @see {@link https://getodk.github.io/xforms-spec/#default-values-in-repeats}
 */
const isExplicitRepeatTemplateElement = (
	sourceElement: StaticElement
): sourceElement is ExplicitRepeatTemplateElement => {
	return sourceElement.attributes.some(isJRTemplateAttribute);
};

const cloneStaticAttributeOptions = (attribute: StaticAttribute): StaticAttributeOptions => {
	return {
		name: attribute.qualifiedName,
		value: attribute.value,
	};
};

interface ClonedSubtreeStructure extends StaticElementOptions {
	readonly attributes: readonly StaticAttributeOptions[];
	readonly children: readonly StaticElementOptions[];
}

const cloneStaticSubtreeStructure = (sourceElement: StaticElement): ClonedSubtreeStructure => {
	const name = sourceElement.qualifiedName;
	const attributes = sourceElement.attributes.map(cloneStaticAttributeOptions);
	const children = sourceElement.childElements.map(cloneStaticSubtreeStructure);

	return {
		name,
		attributes,
		children,
	};
};

/**
 * Clones the **structure** of a {@link StaticElement}, omitting
 * {@link StaticText | text values} of the element itself, and any of its
 * descendants.
 *
 * @todo This function's behavior is **plausibly** general purpose. The function
 * itself, its argument, its local bindings are all named to reflect that fact.
 *
 * However, the **use case** for the function is quite specific: when a form
 * defines a `<repeat>` that isn't associated with an explicit `jr:template`, we
 * fabricate a template by cloning its structure with all text values removed
 * (described in more detail for {@link parseRepeatTemplateElement}).
 *
 * As generalized as this the function is, it's not at all clear how or why we'd
 * use it for other purposes. Even the top-of-mind (at time of writing) use case
 * which might semantically line up with it (i.e. potentially as a basis to
 * reconcile edit instance state into a form definition, as sort of a three-way
 * merge) would effectively be pure overhead. For now, we have something
 * library-ish living here private in this module unless/until we find another
 * good reason to use it elsewhere!
 *
 * If we do find another plausible use case for this behavior, it's pretty
 * likely we'd want to implement it as a part of the {@link StaticElement} (or
 * somewhere else up the class hierarchy to {@link StaticNode}), to encapsulate
 * as much as possible about how it's done. We've been pretty aggressive about
 * changing the internals and signatures of {@link StaticNode}s and the
 * static-dom abstraction. It'd be nice if ongoing changes were a lot more
 * isolated, with far less impact on the growing set of use cases actually
 * consuming the abstraction.
 */
const cloneStaticElementStructure = (sourceElement: StaticElement): StaticElement => {
	const { root: clone } = new StaticDocument({
		documentRoot: cloneStaticSubtreeStructure(sourceElement),
		nodesetPrefix: sourceElement.parent.nodeset,
	});

	return clone;
};

export type RepeatInstanceNodes = readonly [StaticElement, ...StaticElement[]];

/**
 * Produces a consistent "repeat template" interface for each
 * {@link RepeatDefinition}, which is used to produce new repeat instances in
 * {@link PrimaryInstance | runtime form instance state}. How a "repeat
 * template" is parsed is as follows:
 *
 * - If the form definition includes an **explicit template** (as described by
 *   {@link isExplicitRepeatTemplateElement}) as the
 *   {@link firstRepeatInstanceNode | first} node referenced by a `<repeat
 *   nodeset>`, that node is returned as it was already parsed.
 *
 * - If the {@link firstRepeatInstanceNode | first} repeat instance node is
 *   **NOT** an explicit template, a template is **implicitly created** from its
 *   blank structure, as a
 *   {@link cloneStaticElementStructure | clone of its structure}.
 *
 * The latter behavior may sound surprising if unfamiliar, but it is well
 * understood. It is also known to be consistent with Collect (JavaRosa), as
 * demonstrated by affected tests in `@getodk/scenario` which fail when this
 * behavior is changed.
 *
 * - - -
 *
 * Note: this is a vastly simplified evolution of what was previously
 * implemented in
 * {@link https://github.com/getodk/web-forms/blob/99295eb1d6ec78cd6a758385793e97859b6a74cc/packages/xforms-engine/src/parse/model/RepeatTemplateDefinition.ts#L81 | `RepeatTemplateDefinition.parseModelNodes`}
 * (permalink to implementation at time of writing/refactor).
 *
 * That previous implementation was based on a flawed mental model of how a
 * parsed form model relates to the form's instance structure. The following
 * describes the previous flawed mental model, and the reasoning behind revising
 * the mental model established here.
 *
 * - - -
 *
 * **Flawed mental model**
 *
 * Repeat model definitions were composed of a combination of:
 *
 * 1. `RepeatRangeDefinition`: this effectively had a 1:1 correspondence to the
 *    `<repeat>` _body element_ referencing the `nodeset` of 1+ instance nodes
 *    (as defined in the form's model).
 *
 * 2. `RepeatTemplateDefinition`: this had a 0-1:1 correspondence between an
 *    instance node (as defined in the form's model) defining a `jr:template`
 *    attribute, if one exists; if none exists, one was synthesized at parse
 *    time.
 *
 * 3. `RepeatInstanceDefinition`: these had an N:N correspondence to _every
 *    non-template instance node_ (as defined in the form's model).
 *
 * For each instance of a form:
 *
 * - `RepeatRangeControlled` or `RepeatRangeUncontrolled` (engine-internal
 *   implementation of the `RepeatRangeControlledNode` and
 *   `RepeatRangeUncontrolledNode` client interfaces, respectively) also
 *   corresponded 1:1 with a `RepeatRangeDefinition`.
 *
 * - `RepeatInstance` (engine-internal implementation of the
 *   `RepeatInstanceNode`) had an N:N relationship with _either_:
 *   - `RepeatInstanceDefinition`, if one was defined for that repeat instance's
 *     the positional index
 *   - `RepeatTemplateDefinition`, otherwise
 *
 * **Revised mental model**
 *
 * 1. `RepeatDefinition`: merges the responsibilities of the former
 *    `RepeatRangeDefinition` and `RepeatTemplateDefinition`.
 *
 * 2. Repeat instance nodes (as defined in the form's model) are refereced
 *    _during the construction of instance state_ (`PrimaryInstance`):
 *
 *   - if an instance node exists at the positional index of the
 *     `RepeatInstance` to be created, that node is used to populate the
 *     `RepeatInstance`'s initial state
 *
 *   - if no instance node exists at that positional index, the template
 *     returned by {@link RepeatTemplateDefinition.parseRepeatTemplateElement}
 *     is referenced for the `RepeatInstance`'s initial state instead
 *
 * Aside from simplifying the parsing responsibilities associated with repeats,
 * this also creates a roughly 1:1 relationship between the different
 * representations of what we call an "instance node".
 *
 * @todo The above "revised mental model" for repeat definitions pretty much
 * reflects the same principles which will be applied for non-form instance
 * state, i.e. for (a) restoring previously serialized instance state and/or (b)
 * editing previously submitted instance state. It will make sense to reflect
 * that once that aspect of implementation is complete!
 *
 * - - -
 *
 * At time of writing, I believe that detailing the differences between these
 * mental models will provide useful context, in the long term, for reasoning
 * about the relationship between "node definition" and "instance node" (as
 * defined in a form or a serialized and/or submitted instance; also the
 * engine's active, stateful representations of those same nodes).
 *
 * Namely, the revised relationship is _1 (node definition) : N (instance
 * node)_, associated by each instance node's nodeset.
 */
const parseRepeatTemplateElement = (firstRepeatInstanceNode: StaticElement) => {
	if (isExplicitRepeatTemplateElement(firstRepeatInstanceNode)) {
		return firstRepeatInstanceNode;
	}

	return cloneStaticElementStructure(firstRepeatInstanceNode);

	// TODO: We previously **intended** to check for duplicate explicit repeat
	// templates (i.e. defined with a `jr:template` attribute). This was
	// **partially** handled by defining a (temporary/local) mapping from the
	// repeat's `BindDefinition` to an already-parsed explicit template element
	// (if any). Identifying duplicates **should** have been handled by
	// determining that an entry for the same binding already existed. **BUT NO
	// ENTRY WAS NEVER WRITTEN!** This comment is now intended to recognize:
	//
	// 1. ... that the intended behavior was never implemented correctly in the
	//    first place, and we are not making any changes to that intended aspect
	//    of engine behavior/semantics by eliminating the flawed implementation
	//    now.
	//
	// 2. ... that whether this behavior should have even been implemented was
	//    also an open question! The previous text of this
	//    comment's conceptual successor is preserved below, either for clarity in review or for logner-term posterity.
	//
	// - - -
	//
	// Previous text of this comment:
	//
	// > TODO: this is under the assumption that for any depth > 1, if a
	// > template has already been defined for the given form definition, any
	// > subsequent nodes matching the repeat's nodeset are implicitly default
	// > instances. Is this right?
};

export interface ControlledRepeatDefinition extends RepeatDefinition {
	readonly count: RepeatCountControlExpression;
}

export interface UncontrolledRepeatDefinition extends RepeatDefinition {
	readonly count: null;
}

/**
 * Represents a definition of the combined concepts colloquially called a
 * "repeat", as defined by a form, where those concepts include:
 *
 * - A {@link RepeatElementDefinition}—corresponding to a `<repeat>` {@link https://getodk.github.io/xforms-spec/#body-elements | body element}—which is associated with the nodeset referencing the "repeat template" and
 *   all "repeat instances" (see below points describing both concepts in more detail). The presence of such a body element determines whether to produce a repeat definition (rather than e.g. a {@link SubtreeDefinition}).
 *
 * - A "repeat template", defined by a form either
 *   explicitly,
 *   or derived from the structure of the first form-defined "repeat instance"
 *   (as described in the next point).
 *
 * - A sequence of one or more model instance nodes, each representing a "repeat instance"
 *   defined by the form. These nodes contribute to the definition in the following ways:
 *
 *   - If an explicit "repeat template" is not defined for
 *   the "repeat", one is derived from the **structure** (but not the values!)
 *   of the first such model instance node.
 *
 *   - If the "repeat" is {@link ControlledRepeatDefinition | controlled} (i.e. by either a `jr:count` or `jr:noAddRemove` {@link https://getodk.github.io/xforms-spec/#body-attributes | attribute} on the associated {@link RepeatElementDefinition}
 *
 * (For construction of this
 * definition, all other referenced instance nodes are **consumed** in the
 * process of building the repeat definition's subtree of a
 * {@link RootDefinition}, ensuring that one repeat definition is produced for
 * all applicable nodes; they are later referenced for construction of a
 * form's {@link PrimaryInstance | instance state}.)
 *
 * Combined, these concepts produce the details required to instantiate the
 * {@link RepeatRange} and {@link RepeatInstance} instance state nodes
 * associated with a defined repeat.
 */
export class RepeatDefinition extends DescendentNodeDefinition<'repeat', RepeatElementDefinition> {
	static from(
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		bodyElement: RepeatElementDefinition,
		instanceNodes: RepeatInstanceNodes
	): AnyRepeatDefinition;
	static from(
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		bodyElement: RepeatElementDefinition,
		instanceNodes: RepeatInstanceNodes
	): RepeatDefinition {
		return new this(parent, bind, bodyElement, instanceNodes);
	}

	readonly type = 'repeat';
	readonly children: readonly ChildNodeDefinition[];
	readonly count: RepeatCountControlExpression | null;
	readonly template: StaticElement;
	readonly namespaceDeclarations: NamespaceDeclarationMap;
	readonly qualifiedName: QualifiedName;

	private constructor(
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		bodyElement: RepeatElementDefinition,
		instanceNodes: RepeatInstanceNodes
	) {
		super(parent, bind, bodyElement);

		const { root } = parent;
		const [instanceNode] = instanceNodes;
		const template = parseRepeatTemplateElement(instanceNode);
		const self = this as AnyRepeatDefinition;

		this.template = template;
		this.qualifiedName = template.qualifiedName;
		this.namespaceDeclarations = new NamespaceDeclarationMap(this);
		this.children = root.buildSubtree(self, template);

		const initialCount = this.omitTemplate(instanceNodes).length;

		this.count = RepeatCountControlExpression.from(bodyElement, initialCount);
	}

	isControlled(): this is ControlledRepeatDefinition {
		return this.count != null;
	}

	isUncontrolled(): this is UncontrolledRepeatDefinition {
		return this.count == null;
	}

	omitTemplate(instanceNodes: readonly StaticElement[]): readonly StaticElement[] {
		return instanceNodes.filter((instanceNode) => {
			return instanceNode !== this.template;
		});
	}

	toJSON(): object {
		return {};
	}
}

// prettier-ignore
export type AnyRepeatDefinition =
	| ControlledRepeatDefinition
	| UncontrolledRepeatDefinition;
