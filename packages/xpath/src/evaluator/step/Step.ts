import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type {
	AbbreviatedAbsoluteLocationPathNode,
	AbsoluteLocationPathNode,
	AbsoluteRootLocationPathNode,
	FilterExprNode,
	FilterPathExprNode,
	NameTestNode,
	NodeTypeTestNode,
	PredicateNode,
	ProcessingInstructionNameTestNode,
	RelativeLocationPathNode,
	StepNode,
} from '../../static/grammar/SyntaxNode.ts';

type AxisType =
	| 'ancestor-or-self'
	| 'ancestor'
	| 'attribute'
	| 'child'
	| 'descendant-or-self'
	| 'descendant'
	| 'following-sibling'
	| 'following'
	| 'namespace'
	| 'parent'
	| 'preceding-sibling'
	| 'preceding'
	| 'self';

type NodeType =
	| '__NAMED__'
	| 'comment'
	| 'node' // *ANY* node, not for use with name tests
	| 'processing-instruction'
	| 'text';

type StepType =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'NodeTypeTest'
	| 'ProcessingInstructionNameTest'
	// The rest imply named nodes (i.e. Element | Attr, probably not ProcessingInstruction since there's a special affordance for that)
	| 'QualifiedNameTest' // `prefix:localName`
	| 'NodeNameTest' // Note: *not* "unqualified", i.e. `nodeName` != `*[local-name() = "nodeName"]`
	| 'QualifiedWildcardTest' // `prefix:*`
	| 'UnqualifiedWildcardTest'; // `*`

export abstract class BaseStep {
	abstract readonly stepType: StepType;
	abstract readonly nodeType: NodeType;
	abstract readonly localName: string | null | undefined;
	abstract readonly prefix: string | null | undefined;
	abstract readonly nodeName: string | undefined;
	abstract readonly processingInstructionName: string | undefined;

	abstract readonly predicates: readonly PredicateNode[];

	constructor(readonly axisType: AxisType | '__ROOT__') {}
}

export class RootContextStep extends BaseStep {
	override readonly axisType = '__ROOT__';

	readonly stepType = 'NodeTypeTest';
	readonly nodeType = 'node';

	readonly localName = undefined;
	readonly prefix = undefined;
	readonly nodeName = undefined;
	readonly processingInstructionName = undefined;

	readonly predicates: readonly [] = [];

	constructor() {
		super('__ROOT__');
	}
}

interface NonRootStep extends BaseStep {
	readonly axisType: AxisType;
}

export class EvaluationContextNodeStep extends BaseStep implements NonRootStep {
	readonly stepType = 'NodeTypeTest';
	override readonly axisType = 'self';
	readonly nodeType = 'node';

	readonly localName = undefined;
	readonly prefix = undefined;
	readonly nodeName = undefined;
	readonly processingInstructionName = undefined;

	readonly predicates: readonly [] = [];

	constructor() {
		super('self');
	}
}

export class FilterExprContextNodeStep extends BaseStep implements NonRootStep {
	readonly stepType = 'NodeTypeTest';
	override readonly axisType = 'self';
	readonly nodeType = 'node';

	readonly localName = undefined;
	readonly prefix = undefined;
	readonly nodeName = undefined;
	readonly processingInstructionName = undefined;

	readonly predicates: readonly [] = [];

	constructor() {
		super('self');
	}
}

export type PathExprContextStep =
	| EvaluationContextNodeStep
	| FilterExprContextNodeStep
	| RootContextStep;

type UnnamedNodeType = Exclude<NodeType, '__NAMED__'>;

export class NodeTypeTestStep extends BaseStep implements NonRootStep {
	readonly stepType = 'NodeTypeTest';

	readonly localName = undefined;
	readonly prefix = undefined;
	readonly nodeName = undefined;
	readonly processingInstructionName = undefined;

	constructor(
		override readonly axisType: AxisType,
		readonly nodeType: UnnamedNodeType,
		readonly predicates: readonly PredicateNode[]
	) {
		super(axisType);
	}
}

export abstract class BaseNameTestStep extends BaseStep implements NonRootStep {
	abstract override readonly stepType: Exclude<StepType, 'NodeTypeTest'>;
	abstract override readonly axisType: AxisType;
	readonly nodeType = '__NAMED__';
}

export class ProcessingInstructionNameTestStep extends BaseStep implements NonRootStep {
	readonly stepType = 'ProcessingInstructionNameTest';
	readonly localName = undefined;
	readonly prefix = undefined;
	readonly nodeName = undefined;
	readonly nodeType = 'processing-instruction';

	constructor(
		override readonly axisType: AxisType,
		readonly processingInstructionName: string,
		readonly predicates: readonly PredicateNode[]
	) {
		super(axisType);
	}
}

export class QualifiedNameTestStep extends BaseNameTestStep {
	readonly stepType = 'QualifiedNameTest';
	readonly nodeName = undefined;
	readonly processingInstructionName = undefined;

	constructor(
		readonly axisType: AxisType,
		readonly prefix: string,
		readonly localName: string,
		readonly predicates: readonly PredicateNode[]
	) {
		super(axisType);
	}
}

export class NodeNameTestStep extends BaseNameTestStep {
	readonly stepType = 'NodeNameTest';
	readonly localName = undefined;
	readonly prefix = undefined;
	readonly processingInstructionName = undefined;

	constructor(
		readonly axisType: AxisType,
		readonly nodeName: string,
		readonly predicates: readonly PredicateNode[]
	) {
		super(axisType);
	}
}

export class QualifiedWildcardTestStep extends BaseNameTestStep {
	readonly stepType = 'QualifiedWildcardTest';
	readonly localName = null;
	readonly nodeName = undefined;
	readonly processingInstructionName = undefined;

	constructor(
		readonly axisType: AxisType,
		readonly prefix: string,
		readonly predicates: readonly PredicateNode[]
	) {
		super(axisType);
	}
}

export class UnqualifiedWildcardTestStep extends BaseNameTestStep {
	readonly stepType = 'UnqualifiedWildcardTest';
	readonly localName = null;
	readonly prefix = null;
	readonly nodeName = undefined;
	readonly processingInstructionName = undefined;

	constructor(
		readonly axisType: AxisType,
		readonly predicates: readonly PredicateNode[]
	) {
		super(axisType);
	}
}

export type NameTestStep =
	| NodeNameTestStep
	| ProcessingInstructionNameTestStep
	| QualifiedNameTestStep
	| QualifiedWildcardTestStep
	| UnqualifiedWildcardTestStep;

export type AnyStep = NameTestStep | NodeTypeTestStep;

type AxisTestNode = NameTestNode | NodeTypeTestNode | ProcessingInstructionNameTestNode;

const axisTestStep = (
	axisType: AxisType,
	axisTestNode: AxisTestNode,
	predicateNodes: readonly PredicateNode[]
): AnyStep => {
	const { text } = axisTestNode;

	switch (axisTestNode.type) {
		case 'node_type_test': {
			let nodeType: Exclude<NodeType, '__NAMED__'>;

			if (text.startsWith('comment')) {
				nodeType = 'comment';
			} else if (text.startsWith('node')) {
				nodeType = 'node';
			} else if (text.startsWith('processing-instruction')) {
				nodeType = 'processing-instruction';
			} else {
				nodeType = 'text';
			}

			return new NodeTypeTestStep(axisType, nodeType, predicateNodes);
		}

		case 'prefixed_name': {
			const [prefixNode, localPartNode] = axisTestNode.children;

			return new QualifiedNameTestStep(
				axisType,
				prefixNode.text,
				localPartNode.text,
				predicateNodes
			);
		}

		case 'prefixed_wildcard_name_test': {
			const [prefixNode] = axisTestNode.children;
			return new QualifiedWildcardTestStep(axisType, prefixNode.text, predicateNodes);
		}

		case 'unprefixed_name': {
			return new NodeNameTestStep(axisType, axisTestNode.text, predicateNodes);
		}

		case 'unprefixed_wildcard_name_test':
			return new UnqualifiedWildcardTestStep(axisType, predicateNodes);

		case 'processing_instruction_name_test': {
			const [nameNode] = axisTestNode.children;
			const { text: nameText } = nameNode;
			const procssingInstructionName = nameText.substring(1, nameText.length - 1);
			return new ProcessingInstructionNameTestStep(
				axisType,
				procssingInstructionName,
				predicateNodes
			);
		}

		default:
			throw new UnreachableError(axisTestNode);
	}
};

const pathExprStep = (stepNode: StepNode): AnyStep => {
	const [syntaxNode, ...predicateNodes] = stepNode.children;

	switch (syntaxNode.type) {
		case 'abbreviated_axis_test': {
			const [axisTestNode] = syntaxNode.children;

			return axisTestStep('attribute', axisTestNode, predicateNodes);
		}

		case 'abbreviated_step': {
			let axisType: 'parent' | 'self';

			switch (syntaxNode.text) {
				case '.':
					axisType = 'self';
					break;

				case '..':
					axisType = 'parent';
					break;

				default:
					throw new UnreachableError(syntaxNode);
			}

			return new NodeTypeTestStep(axisType, 'node', predicateNodes);
		}

		case 'axis_test': {
			const [axisNameNode, axisTestNode] = syntaxNode.children;

			return axisTestStep(axisNameNode.text, axisTestNode, predicateNodes);
		}

		case 'node_test': {
			const [axisTestNode] = syntaxNode.children;

			return axisTestStep('child', axisTestNode, predicateNodes);
		}

		default:
			throw new UnreachableError(syntaxNode);
	}
};

type AnyLocationPathExprNode =
	| AbsoluteLocationPathNode
	| FilterPathExprNode
	| RelativeLocationPathNode;

type PathExprContextNode =
	| AbbreviatedAbsoluteLocationPathNode
	| AbsoluteRootLocationPathNode
	| FilterExprNode
	| StepNode;

const pathExprContextStep = (syntaxNode: PathExprContextNode): PathExprContextStep => {
	switch (syntaxNode.type) {
		case 'abbreviated_absolute_location_path':
		case 'absolute_root_location_path':
			return new RootContextStep();

		case 'filter_expr':
			return new FilterExprContextNodeStep();

		case 'step':
			return new EvaluationContextNodeStep();

		default:
			throw new UnreachableError(syntaxNode);
	}
};

type ContextualizedStep = Exclude<AnyStep, { readonly axisType: '__ROOT__' }>;

export type PathExprSteps = readonly [context: PathExprContextStep, ...steps: ContextualizedStep[]];

export const pathExprSteps = (syntaxNode: AnyLocationPathExprNode): PathExprSteps => {
	const { children } = syntaxNode;
	const [contextChildNode, ...rest] = children;
	// prettier-ignore
	const stepNodes =
		contextChildNode.type === 'abbreviated_absolute_location_path'
			? contextChildNode.children
		: contextChildNode.type === 'step'
			? [contextChildNode, ...rest]
			: rest;

	const contextStep = pathExprContextStep(contextChildNode);
	const steps: AnyStep[] = [];

	for (const stepNode of stepNodes) {
		switch (stepNode.type) {
			case '//':
				steps.push(new NodeTypeTestStep('descendant-or-self', 'node', []));
				break;

			case 'step':
				steps.push(pathExprStep(stepNode));
				break;

			default:
				throw new UnreachableError(stepNode);
		}
	}

	return [contextStep, ...steps];
};
