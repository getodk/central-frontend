import type { SyntaxType, UnnamedType } from '@getodk/tree-sitter-xpath';
import { assertType, type Exact } from '../../type-safety';

/*
 * ============================================================================
 * Expressions
 * ============================================================================
 */

/**
 * The root node of any parsed XPath expression's syntax tree.
 *
 * {@link XPathType} will _always_ have one child, of type {@link ExprType}.
 *
 */
export type XPathType = `${SyntaxType.Xpath}`;

/**
 * A node representing any complete XPath expression or sub-expression, which
 * may be either:
 *
 * - The direct and only child of {@link XPathType}, representing the top level
 *   of a parsed XPath expression.
 *
 * - A child of any node accepting a full sub-expression, e.g. those passed
 *   as arguments to a {@link FunctionCallType}
 */
export type ExprType = `${SyntaxType.Expr}`;

/*
 * ----------------------------------------------------------------------------
 * Operations (i.e. the unary negation expression, any binary expression)
 * ----------------------------------------------------------------------------
 */

type NonOperationExprType = FilterExprType | FilterPathExprType;

type OperationExprType = Exclude<Extract<SyntaxType, `${string}_expr`>, NonOperationExprType>;

export type UnaryExprType = `${SyntaxType.UnaryExpr}`;

export type AdditionExprType = `${SyntaxType.AdditionExpr}`;
export type AndExprType = `${SyntaxType.AndExpr}`;
export type DivisionExprType = `${SyntaxType.DivisionExpr}`;
export type EqExprType = `${SyntaxType.EqExpr}`;
export type GtExprType = `${SyntaxType.GtExpr}`;
export type GteExprType = `${SyntaxType.GteExpr}`;
export type LtExprType = `${SyntaxType.LtExpr}`;
export type LteExprType = `${SyntaxType.LteExpr}`;
export type ModuloExprType = `${SyntaxType.ModuloExpr}`;
export type MultiplicationExprType = `${SyntaxType.MultiplicationExpr}`;
export type NeExprType = `${SyntaxType.NeExpr}`;
export type OrExprType = `${SyntaxType.OrExpr}`;
export type SubtractionExprType = `${SyntaxType.SubtractionExpr}`;
export type UnionExprType = `${SyntaxType.UnionExpr}`;

export type BinaryExprType =
	| AdditionExprType
	| AndExprType
	| DivisionExprType
	| EqExprType
	| GteExprType
	| GtExprType
	| LteExprType
	| LtExprType
	| ModuloExprType
	| MultiplicationExprType
	| NeExprType
	| OrExprType
	| SubtractionExprType
	| UnionExprType;

assertType?.<Exact<AnyBinaryExprType, BinaryExprType>>();
assertType?.<Exact<OperationExprType, BinaryExprType | UnaryExprType>>();

/*
 * ----------------------------------------------------------------------------
 * Location paths and their component parts
 * ----------------------------------------------------------------------------
 */

export type FilterExprType = `${SyntaxType.FilterExpr}`;
export type FilterPathExprType = `${SyntaxType.FilterPathExpr}`;
export type AbsoluteLocationPathType = `${SyntaxType.AbsoluteLocationPath}`;
export type AbsoluteRootLocationPathType = `${SyntaxType.AbsoluteRootLocationPath}`;
export type RelativeLocationPathType = `${SyntaxType.RelativeLocationPath}`;

/**
 * @example ```xpath
 * //any-descendant
 * ```
 */
export type AbbreviatedAbsoluteLocationPathType = `${SyntaxType.AbbreviatedAbsoluteLocationPath}`;

export type AbbreviatedAxisTestType = `${SyntaxType.AbbreviatedAxisTest}`;
export type AbbreviatedStepType = `${SyntaxType.AbbreviatedStep}`;
export type AxisNameType = `${SyntaxType.AxisName}`;
export type AxisTestType = `${SyntaxType.AxisTest}`;
export type NodeTestType = `${SyntaxType.NodeTest}`;
export type NodeTypeTestType = `${SyntaxType.NodeTypeTest}`;
export type ProcessingInstructionNameTestType = `${SyntaxType.ProcessingInstructionNameTest}`;
export type StepType = `${SyntaxType.Step}`;

export type ParentType = `${SyntaxType.Parent}`;
export type SelfType = `${SyntaxType.Self}`;

export type RelativeStepSyntaxLiteral = Extract<UnnamedType, '//'>;

// Technically predicates shouldn't be grouped only with location paths, e.g.
// in an expression like `id("foo")[bar()]`
export type PredicateType = `${SyntaxType.Predicate}`;

/*
 * ----------------------------------------------------------------------------
 * Functions (call, name, arguments)
 * ----------------------------------------------------------------------------
 */

export type FunctionCallType = `${SyntaxType.FunctionCall}`;
export type FunctionNameType = `${SyntaxType.FunctionName}`;
export type ArgumentType = `${SyntaxType.Argument}`;

/*
 * ----------------------------------------------------------------------------
 * Names
 * ----------------------------------------------------------------------------
 */

export type PrefixedNameType = `${SyntaxType.PrefixedName}`;
export type PrefixType = `${SyntaxType.Prefix}`;
export type LocalPartType = `${SyntaxType.LocalPart}`;
export type PrefixedWildcardNameTestType = `${SyntaxType.PrefixedWildcardNameTest}`;
export type UnprefixedNameType = `${SyntaxType.UnprefixedName}`;
export type UnprefixedWildcardNameTestType = `${SyntaxType.UnprefixedWildcardNameTest}`;

/*
 * ----------------------------------------------------------------------------
 * Variables (broken)
 * ----------------------------------------------------------------------------
 */

export type VariableReferenceType = `${SyntaxType.VariableReference}`;

/*
 * ----------------------------------------------------------------------------
 * Primitive literals
 * ----------------------------------------------------------------------------
 */

export type NumberType = `${SyntaxType.Number}`;
export type LiteralType = `${SyntaxType.StringLiteral}`;

/**
 * @alias {@link LiteralType}
 */
export type StringLiteralType = LiteralType;

/*
 * ----------------------------------------------------------------------------
 * Parse errors
 * ----------------------------------------------------------------------------
 */

export type ErrorType = `${SyntaxType.ERROR}`;

/*
 * ----------------------------------------------------------------------------
 * Any* types, i.e. categories of related syntax parts
 * ----------------------------------------------------------------------------
 */

// These are manually identified by examining the grammar (for now...?)
type AnyApparentExprType =
	| AdditionExprType
	| AndExprType
	| DivisionExprType
	| EqExprType
	| FilterPathExprType
	| FunctionCallType
	| GteExprType
	| GtExprType
	| LiteralType
	| LteExprType
	| LtExprType
	| ModuloExprType
	| MultiplicationExprType
	| NeExprType
	| NumberType
	| OrExprType
	| SubtractionExprType
	| UnaryExprType
	| UnionExprType;

export type AnyExprType = AnyApparentExprType;

export type AnyOperationExprType = OperationExprType;

export type AnyBinaryExprType = BinaryExprType;

export type AnyUnaryExprType = UnaryExprType;

export type AnyLocationPathType =
	| AbbreviatedAbsoluteLocationPathType
	| AbbreviatedAxisTestType
	| AbbreviatedStepType
	| AbsoluteLocationPathType
	| AbsoluteRootLocationPathType
	| AxisNameType
	| AxisTestType
	| FilterExprType
	| FilterPathExprType
	| NodeTestType
	| NodeTypeTestType
	| ParentType
	| PredicateType
	| ProcessingInstructionNameTestType
	| RelativeLocationPathType
	| RelativeStepSyntaxLiteral
	| SelfType
	| StepType;

export type AnyFunctionType = ArgumentType | FunctionCallType | FunctionNameType;

export type AnyNameType =
	| LocalPartType
	| PrefixedNameType
	| PrefixedWildcardNameTestType
	| PrefixType
	| UnprefixedNameType
	| UnprefixedWildcardNameTestType;

export type AnyLiteralType = LiteralType | NumberType;

export type AnyContextuallyScopedType = VariableReferenceType;

export type AnySyntaxType =
	| AnyBinaryExprType
	| AnyContextuallyScopedType
	| AnyExprType
	| AnyFunctionType
	| AnyLiteralType
	| AnyLocationPathType
	| AnyNameType
	| AnyUnaryExprType
	| ExprType
	| XPathType;

/*
 * ============================================================================
 * Test types
 * ============================================================================
 */

assertType?.<Exact<SyntaxType | UnnamedType, AnySyntaxType | ErrorType>>();
