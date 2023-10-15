import { assertType, type Exact } from '../../type-safety';
import type {
	AbbreviatedAbsoluteLocationPathType,
	AbbreviatedAxisTestType,
	AbbreviatedStepType,
	AbsoluteLocationPathType,
	AbsoluteRootLocationPathType,
	AdditionExprType,
	AndExprType,
	AnyBinaryExprType,
	AnySyntaxType,
	AnyUnaryExprType,
	ArgumentType,
	AxisNameType,
	AxisTestType,
	DivisionExprType,
	EqExprType,
	ExprType,
	FilterExprType,
	FilterPathExprType,
	FunctionCallType,
	FunctionNameType,
	GteExprType,
	GtExprType,
	LiteralType,
	LocalPartType,
	LteExprType,
	LtExprType,
	ModuloExprType,
	MultiplicationExprType,
	NeExprType,
	NodeTestType,
	NodeTypeTestType,
	NumberType,
	OrExprType,
	ParentType,
	PredicateType,
	PrefixedNameType,
	PrefixedWildcardNameTestType,
	PrefixType,
	ProcessingInstructionNameTestType,
	RelativeLocationPathType,
	RelativeStepSyntaxLiteral,
	SelfType,
	StepType,
	SubtractionExprType,
	UnionExprType,
	UnprefixedNameType,
	UnprefixedWildcardNameTestType,
	VariableReferenceType,
	XPathType,
} from './type-names.ts';

/*
 * ============================================================================
 * Generic syntax node base types
 * ============================================================================
 */

export interface SyntaxNode<
	Type extends AnySyntaxType,
	Children extends readonly UnknownSyntaxNode[],
	Text extends string = string,
> {
	readonly type: Type;

	readonly childCount: Children['length'];
	readonly children: Children;
	readonly text: Text;

	child<Index extends number>(
		index: Index
	): `${Index}` extends keyof Children
		? Children[Index]
		: Exclude<Children[Index], undefined> | null;

	child(index: number): Exclude<Children[number], undefined> | null;
}

// TODO naming
export interface ASyntaxNode extends SyntaxNode<AnySyntaxType, readonly ASyntaxNode[]> {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UnknownSyntaxNode extends SyntaxNode<any, any> {}

export interface TerminalSyntaxNode<Type extends AnySyntaxType>
	extends SyntaxNode<Type, readonly []> {}

export interface UnaryExprSyntaxNode<Type extends AnyUnaryExprType>
	extends SyntaxNode<Type, readonly [AnyExprNode]> {}

export interface BinaryExprSyntaxNode<Type extends AnyBinaryExprType>
	extends SyntaxNode<Type, readonly [AnyExprNode, AnyExprNode]> {}

export interface TerminalTextLiteralSyntaxNode<Type extends AnySyntaxType, Text extends string>
	extends SyntaxNode<Type, readonly [], Text> {}

/*
 * ============================================================================
 * Expressions
 * ============================================================================
 */

export interface XPathNode extends SyntaxNode<XPathType, readonly [ExprNode]> {}

export interface ExprNode extends SyntaxNode<ExprType, readonly [AnyExprNode]> {}

/*
 * ----------------------------------------------------------------------------
 * Operations
 * ----------------------------------------------------------------------------
 */

export interface UnaryExprNode extends UnaryExprSyntaxNode<AnyUnaryExprType> {}

export interface AdditionExprNode extends BinaryExprSyntaxNode<AdditionExprType> {}
export interface AndExprNode extends BinaryExprSyntaxNode<AndExprType> {}

export interface DivisionExprNode extends BinaryExprSyntaxNode<DivisionExprType> {}

export interface EqExprNode extends BinaryExprSyntaxNode<EqExprType> {}

export interface GtExprNode extends BinaryExprSyntaxNode<GtExprType> {}

export interface GteExprNode extends BinaryExprSyntaxNode<GteExprType> {}

export interface LtExprNode extends BinaryExprSyntaxNode<LtExprType> {}

export interface LteExprNode extends BinaryExprSyntaxNode<LteExprType> {}

export interface ModuloExprNode extends BinaryExprSyntaxNode<ModuloExprType> {}

export interface MultiplicationExprNode extends BinaryExprSyntaxNode<MultiplicationExprType> {}

export interface NeExprNode extends BinaryExprSyntaxNode<NeExprType> {}

export interface OrExprNode extends BinaryExprSyntaxNode<OrExprType> {}

export interface SubtractionExprNode extends BinaryExprSyntaxNode<SubtractionExprType> {}

export interface UnionExprNode extends BinaryExprSyntaxNode<UnionExprType> {}

type AnyUnaryExprNode = UnaryExprNode;

export type AnyBinaryExprNode =
	| AdditionExprNode
	| AndExprNode
	| DivisionExprNode
	| EqExprNode
	| GteExprNode
	| GtExprNode
	| LteExprNode
	| LtExprNode
	| ModuloExprNode
	| MultiplicationExprNode
	| NeExprNode
	| OrExprNode
	| SubtractionExprNode
	| UnionExprNode;

/*
 * ----------------------------------------------------------------------------
 * Location paths
 * ----------------------------------------------------------------------------
 */

export type FilterExprNodes =
	// | VariableReferenceNode
	| readonly [ExprNode]
	| readonly [FunctionCallNode]
	| readonly [LiteralNode]
	| readonly [NumberNode];

export interface FilterExprNode extends SyntaxNode<FilterExprType, FilterExprNodes> {}

export interface FilterPathExprNode
	extends SyntaxNode<
		FilterPathExprType,
		readonly [FilterExprNode, ...Array<RelativeStepSyntaxLiteralNode | StepNode>]
	> {}

type AbsoluteLocationPathNodes =
	| readonly [AbbreviatedAbsoluteLocationPathNode]
	| readonly [AbsoluteRootLocationPathNode, ...RelativeLocationPathNodes];

export interface AbsoluteLocationPathNode
	extends SyntaxNode<AbsoluteLocationPathType, AbsoluteLocationPathNodes> {}

export interface AbsoluteRootLocationPathNode
	extends TerminalTextLiteralSyntaxNode<AbsoluteRootLocationPathType, '/'> {}

type RelativeLocationPathNodes = readonly [
	StepNode,
	...Array<RelativeStepSyntaxLiteralNode | StepNode>,
];

export interface RelativeLocationPathNode
	extends SyntaxNode<RelativeLocationPathType, RelativeLocationPathNodes> {}

export interface AbbreviatedAbsoluteLocationPathNode
	extends SyntaxNode<
		AbbreviatedAbsoluteLocationPathType,
		readonly [RelativeStepSyntaxLiteralNode, ...RelativeLocationPathNodes]
	> {}

export interface AbbreviatedAxisTestNode
	extends SyntaxNode<AbbreviatedAxisTestType, readonly [NameTestNode]> {}

export interface AbbreviatedStepNode
	extends TerminalTextLiteralSyntaxNode<AbbreviatedStepType, '..' | '.'> {}

export type AxisNameText =
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

export interface AxisNameNode extends TerminalTextLiteralSyntaxNode<AxisNameType, AxisNameText> {}

export interface AxisTestNode
	extends SyntaxNode<AxisTestType, readonly [AxisNameNode, ...NodeTestNodes]> {}

export type NameTestNode =
	| ExplicitNameNode
	| PrefixedWildcardNameTestNode
	| UnprefixedWildcardNameTestNode;

export type NodeTypeTest = 'comment' | 'node' | 'processing-instruction' | 'text';

// TODO (in tree-sitter grammar), this accounts for the grammar node being
// implemented as a regex like `/node\s*\(\s*\)/`
export type NodeTypeTestText = `${NodeTypeTest}${string}`;

export interface NodeTypeTestNode
	extends TerminalTextLiteralSyntaxNode<NodeTypeTestType, NodeTypeTestText> {}

export interface ProcessingInstructionNameTestNode
	extends SyntaxNode<ProcessingInstructionNameTestType, readonly [LiteralNode]> {}

export type NodeTestNodes =
	| readonly [NameTestNode]
	| readonly [NodeTypeTestNode]
	| readonly [ProcessingInstructionNameTestNode];

export interface NodeTestNode extends SyntaxNode<NodeTestType, NodeTestNodes> {}

type StepTestNode = AbbreviatedAxisTestNode | AxisTestNode | NodeTestNode;

type StepNodes = readonly [AbbreviatedStepNode] | readonly [StepTestNode, ...PredicateNode[]];

export interface StepNode extends SyntaxNode<StepType, StepNodes> {}

export interface ParentNode extends TerminalTextLiteralSyntaxNode<ParentType, '..'> {}

export interface SelfNode extends TerminalTextLiteralSyntaxNode<SelfType, '.'> {}

export interface PredicateNode extends SyntaxNode<PredicateType, readonly [ExprNode]> {}

export interface RelativeStepSyntaxLiteralNode
	extends TerminalTextLiteralSyntaxNode<RelativeStepSyntaxLiteral, '//'> {}

type AnyLocationPathExprNode =
	| AbsoluteLocationPathNode
	| FilterPathExprNode
	| RelativeLocationPathNode;

type AnyLocationPathNode =
	| AbbreviatedAbsoluteLocationPathNode
	| AbbreviatedAxisTestNode
	| AbbreviatedStepNode
	| AbsoluteRootLocationPathNode
	| AnyLocationPathExprNode
	| AxisNameNode
	| AxisTestNode
	| FilterExprNode
	| NodeTestNode
	| NodeTypeTestNode
	| ParentNode
	| PredicateNode
	| ProcessingInstructionNameTestNode
	| RelativeStepSyntaxLiteralNode
	| SelfNode
	| StepNode;

/*
 * ----------------------------------------------------------------------------
 * Functions
 * ----------------------------------------------------------------------------
 */

export interface FunctionCallNode
	extends SyntaxNode<FunctionCallType, readonly [FunctionNameNode, ...ArgumentNode[]]> {}

export interface FunctionNameNode
	extends SyntaxNode<FunctionNameType, readonly [ExplicitNameNode]> {}

export interface ArgumentNode extends SyntaxNode<ArgumentType, readonly [ExprNode]> {}

type AnyFunctionNode = ArgumentNode | FunctionCallNode | FunctionNameNode;

/*
 * ----------------------------------------------------------------------------
 * Names
 * ----------------------------------------------------------------------------
 */

export interface PrefixNode extends TerminalSyntaxNode<PrefixType> {}

export interface LocalPartNode extends TerminalSyntaxNode<LocalPartType> {}

export interface PrefixedWildcardNameTestNode
	extends SyntaxNode<PrefixedWildcardNameTestType, readonly [PrefixNode]> {}

export interface UnprefixedWildcardNameTestNode
	extends TerminalSyntaxNode<UnprefixedWildcardNameTestType> {}

export interface PrefixedNameNode
	extends SyntaxNode<PrefixedNameType, readonly [PrefixNode, LocalPartNode]> {}

export interface UnprefixedNameNode extends TerminalSyntaxNode<UnprefixedNameType> {}

type ExplicitNameNode = PrefixedNameNode | UnprefixedNameNode;

export type AnyNameNode =
	| LocalPartNode
	| PrefixedNameNode
	| PrefixedWildcardNameTestNode
	| PrefixNode
	| UnprefixedNameNode
	| UnprefixedWildcardNameTestNode;

/*
 * ----------------------------------------------------------------------------
 * Primitive literals
 * ----------------------------------------------------------------------------
 */

export interface NumberNode extends TerminalSyntaxNode<NumberType> {}

export interface LiteralNode extends TerminalSyntaxNode<LiteralType> {}

type AnyLiteralNode = LiteralNode | NumberNode;

/*
 * ----------------------------------------------------------------------------
 * ...TODO...
 * ----------------------------------------------------------------------------
 */

// Broken (or removed from grammar?)?
export interface VariableReferenceNode extends TerminalSyntaxNode<VariableReferenceType> {}

type AnyContextuallyScopedNode = VariableReferenceNode;

/*
 * ----------------------------------------------------------------------------
 * Groups and aliases
 * ----------------------------------------------------------------------------
 */

export type AnyExprNode =
	| AdditionExprNode
	| AndExprNode
	| AnyLocationPathExprNode
	| DivisionExprNode
	| EqExprNode
	| FunctionCallNode
	| GteExprNode
	| GtExprNode
	| LiteralNode
	| LteExprNode
	| LtExprNode
	| ModuloExprNode
	| MultiplicationExprNode
	| NeExprNode
	| NumberNode
	| OrExprNode
	| SubtractionExprNode
	| UnaryExprNode
	| UnionExprNode;

/**
 * @alias {@link LiteralNode}
 */
export type StringLiteralNode = LiteralNode;

export type AnySyntaxNode =
	| AnyBinaryExprNode
	| AnyContextuallyScopedNode
	| AnyExprNode
	| AnyFunctionNode
	| AnyLiteralNode
	| AnyLocationPathNode
	| AnyNameNode
	| AnyUnaryExprNode
	| ExprNode
	| XPathNode;

type AnySyntaxNodeType = AnySyntaxNode['type'];

assertType?.<Exact<AnySyntaxType, AnySyntaxNodeType>>();
