import { chain } from 'itertools-ts/lib/multi';
import { EvaluationContext } from '../../context/EvaluationContext.ts';
import { BooleanEvaluation } from '../../evaluations/BooleanEvaluation.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import { NumberEvaluation } from '../../evaluations/NumberEvaluation.ts';
import { StringEvaluation } from '../../evaluations/StringEvaluation.ts';
import { sortDocumentOrder } from '../../lib/dom/sort.ts';
import { UnreachableError } from '../../lib/error/UnreachableError.ts';
import { distinct } from '../../lib/iterators/common.ts';
import type {
	AbsoluteLocationPathNode,
	AdditionExprNode,
	AndExprNode,
	AnyBinaryExprNode,
	AnyExprNode,
	ArgumentNode,
	DivisionExprNode,
	EqExprNode,
	ExprNode,
	FilterPathExprNode,
	FunctionCallNode,
	GtExprNode,
	GteExprNode,
	LiteralNode,
	LtExprNode,
	LteExprNode,
	ModuloExprNode,
	MultiplicationExprNode,
	NeExprNode,
	NumberNode,
	OrExprNode,
	RelativeLocationPathNode,
	SubtractionExprNode,
	UnaryExprNode,
	UnionExprNode,
	XPathNode,
} from '../../static/grammar/SyntaxNode.ts';
import type { PathExprSteps } from '../step/Step.ts';
import { pathExprSteps } from '../step/Step.ts';
import type { ContextNode } from '../../lib/dom/types.ts';

export type EvaluableExprNode = AnyExprNode | ArgumentNode | ExprNode | XPathNode;

type ExpressionNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	AnyExprNode | FilterPathExprNode | AbsoluteLocationPathNode | RelativeLocationPathNode;

interface ExpressionEvaluator {
	readonly syntaxNode: ExpressionNode;

	evaluate(context: EvaluationContext): Evaluation;
}

abstract class NumberExpressionEvaluator<ConstValue extends number | null = null>
	implements ExpressionEvaluator
{
	constructor(protected readonly constValue: ConstValue) {}

	abstract readonly syntaxNode: ExpressionNode;
	abstract evaluateNumber(context: EvaluationContext): number;

	evaluate(context: EvaluationContext): NumberEvaluation {
		const numberValue = this.evaluateNumber(context);

		return new NumberEvaluation(context.currentContext(), numberValue);
	}
}

abstract class StringExpressionEvaluator<ConstValue extends string | null = null>
	implements ExpressionEvaluator
{
	constructor(protected readonly constValue: ConstValue) {}

	abstract readonly syntaxNode: ExpressionNode;
	abstract evaluateString(context: EvaluationContext): string;

	evaluate(context: EvaluationContext): StringEvaluation {
		const stringValue = this.evaluateString(context);

		return new StringEvaluation(context.currentContext(), stringValue);
	}
}

export abstract class LocationPathExpressionEvaluator implements ExpressionEvaluator {
	abstract readonly syntaxNode: ExpressionNode;
	abstract evaluateNodes(context: EvaluationContext): Iterable<Node>;

	evaluate(context: EvaluationContext): Evaluation<'NODE'> {
		const locationPathContext = context.currentContext();

		return locationPathContext.evaluateLocationPathExpression(this);
	}
}

interface AnyExpression extends ExpressionEvaluator {}

export { type AnyExpression as Expression };

type BinaryExpressionEvaluation = BooleanEvaluation | NumberEvaluation;

interface TypedExpressionEvaluator<Evaluated extends Evaluation> extends ExpressionEvaluator {
	evaluate(context: EvaluationContext): Evaluated;
}

abstract class BinaryExpression<
	Node extends AnyBinaryExprNode,
	Evaluated extends BinaryExpressionEvaluation,
> implements TypedExpressionEvaluator<Evaluated>
{
	readonly lhs: TypedExpressionEvaluator<Evaluated>;
	readonly rhs: TypedExpressionEvaluator<Evaluated>;

	constructor(readonly syntaxNode: Node) {
		const [lhsNode, rhsNode] = syntaxNode.children;

		this.lhs = createExpression(lhsNode) as TypedExpressionEvaluator<Evaluated>;
		this.rhs = createExpression(rhsNode) as TypedExpressionEvaluator<Evaluated>;
	}

	abstract evaluate(context: EvaluationContext): Evaluated;
}

type BooleanBinaryExprNode =
	| AndExprNode
	| EqExprNode
	| GteExprNode
	| GtExprNode
	| LteExprNode
	| LtExprNode
	| NeExprNode
	| OrExprNode;

type BooleanOperator<Node extends BooleanBinaryExprNode> = Node extends AndExprNode
	? 'and'
	: Node extends EqExprNode
	? 'eq'
	: Node extends GtExprNode
	? 'gt'
	: Node extends GteExprNode
	? 'gte'
	: Node extends LtExprNode
	? 'lt'
	: Node extends LteExprNode
	? 'lte'
	: Node extends NeExprNode
	? 'ne'
	: Node extends OrExprNode
	? 'or'
	: never;

type CompareOperator = 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'ne';

class BooleanBinaryExpression<Node extends BooleanBinaryExprNode> extends BinaryExpression<
	Node,
	BooleanEvaluation
> {
	readonly operator: BooleanOperator<Node>;

	constructor(syntaxNode: Node) {
		super(syntaxNode);

		this.operator = syntaxNode.type.replace('_expr', '') as BooleanOperator<Node>;
	}

	protected and(context: EvaluationContext): BooleanEvaluation {
		const { lhs, rhs } = this;
		const lhsResult = lhs.evaluate(context);

		if (lhsResult.toBoolean()) {
			return rhs.evaluate(context);
		}

		return lhsResult;
	}

	protected or(context: EvaluationContext): BooleanEvaluation {
		const { lhs, rhs } = this;

		const lhsResult = lhs.evaluate(context);

		if (lhsResult.toBoolean()) {
			return lhsResult;
		}

		return rhs.evaluate(context);
	}

	protected compare(context: EvaluationContext, operator: CompareOperator): BooleanEvaluation {
		const { lhs, rhs } = this;

		const lhsResult = lhs.evaluate(context);
		const rhsResult = rhs.evaluate(context);

		return new BooleanEvaluation(context.currentContext(), lhsResult[operator](rhsResult));
	}

	evaluate(context: EvaluationContext): BooleanEvaluation {
		const { operator } = this;

		switch (operator) {
			case 'and':
				return this.and(context);

			case 'or':
				return this.or(context);

			default:
				return this.compare(context, operator);
		}
	}
}

type NumericBinaryExprNode =
	| AdditionExprNode
	| DivisionExprNode
	| ModuloExprNode
	| MultiplicationExprNode
	| SubtractionExprNode;

type NumericOperation<Node extends NumericBinaryExprNode> = Node extends AdditionExprNode
	? 'addition'
	: Node extends DivisionExprNode
	? 'division'
	: Node extends ModuloExprNode
	? 'modulo'
	: Node extends MultiplicationExprNode
	? 'multiplication'
	: Node extends SubtractionExprNode
	? 'subtraction'
	: never;

class NumericBinaryExpression<Node extends NumericBinaryExprNode> extends BinaryExpression<
	Node,
	NumberEvaluation
> {
	readonly operation: NumericOperation<Node>;

	constructor(node: Node) {
		super(node);

		this.operation = node.type.replace('_expr', '') as NumericOperation<Node>;
	}

	evaluate(context: EvaluationContext): NumberEvaluation {
		const lhsNumberValue = this.lhs.evaluate(context).toNumber();

		if (Number.isNaN(lhsNumberValue)) {
			return new NumberEvaluation(context.currentContext(), NaN);
		}

		const rhsNumberValue = this.rhs.evaluate(context).toNumber();

		if (Number.isNaN(rhsNumberValue)) {
			return new NumberEvaluation(context.currentContext(), NaN);
		}

		const { operation } = this;

		let numberValue: number;

		switch (operation) {
			case 'addition':
				numberValue = lhsNumberValue + rhsNumberValue;
				break;

			case 'division':
				numberValue = lhsNumberValue / rhsNumberValue;
				break;

			case 'modulo':
				numberValue = lhsNumberValue % rhsNumberValue;
				break;

			case 'multiplication':
				numberValue = lhsNumberValue * rhsNumberValue;
				break;

			case 'subtraction':
				numberValue = lhsNumberValue - rhsNumberValue;
				break;

			default:
				throw new UnreachableError(operation);
		}

		return new NumberEvaluation(context.currentContext(), numberValue);
	}
}

class UnionExpression extends LocationPathExpressionEvaluator {
	readonly lhs: ExpressionEvaluator;
	readonly rhs: ExpressionEvaluator;

	constructor(readonly syntaxNode: UnionExprNode) {
		super();

		const [lhsNode, rhsNode] = syntaxNode.children;

		this.lhs = createExpression(lhsNode);
		this.rhs = createExpression(rhsNode);
	}

	evaluateNodes(context: EvaluationContext): Iterable<Node> {
		const lhs = this.lhs.evaluate(context);

		if (!(lhs instanceof LocationPathEvaluation)) {
			throw 'todo lhs not node-set result';
		}

		const rhs = this.rhs.evaluate(context);

		if (!(rhs instanceof LocationPathEvaluation)) {
			throw 'todo rhs not node-set result';
		}

		return sortDocumentOrder(distinct(chain(lhs.nodes, rhs.nodes)));
	}
}

class UnaryExpression extends NumberExpressionEvaluator {
	readonly operand: ExpressionEvaluator;

	constructor(readonly syntaxNode: UnaryExprNode) {
		super(null);

		this.operand = createExpression(syntaxNode.children[0]);
	}

	evaluateNumber(context: EvaluationContext): number {
		return this.operand.evaluate(context).toNumber() * -1;
	}
}

class FunctionCallExpression implements ExpressionEvaluator {
	readonly functionName: string;
	readonly argumentExpressions: readonly ExpressionEvaluator[];

	constructor(readonly syntaxNode: FunctionCallNode) {
		const [{ text: functionName }, ...argumentNodes] = syntaxNode.children;

		this.functionName = functionName;

		this.argumentExpressions = argumentNodes.map((argumentNode) => {
			return createExpression(argumentNode);
		});
	}

	evaluate(context: EvaluationContext): Evaluation {
		const { argumentExpressions, functionName } = this;
		const { functionLibrary } = context;

		if (context.functionLibrary.has(functionName)) {
			return functionLibrary.call(functionName, context.currentContext(), argumentExpressions);
		}

		throw `todo funcion not defined: ${functionName}`;
	}
}

type LocationPathNode = AbsoluteLocationPathNode | FilterPathExprNode | RelativeLocationPathNode;

interface LocationPathExpressionOptions {
	readonly isAbsolute: boolean;
	readonly isFilterExprContext: boolean;
	readonly isRoot: boolean;
	readonly isSelf: boolean;
}

class LocationPathExpression
	extends LocationPathExpressionEvaluator
	implements ExpressionEvaluator
{
	protected isAbsolute: boolean;
	protected isFilterExprContext: boolean;
	protected isRoot: boolean;
	protected isSelf: boolean;

	protected steps: PathExprSteps;

	constructor(
		readonly syntaxNode: LocationPathNode,
		options: LocationPathExpressionOptions
	) {
		super();

		this.isAbsolute = options.isAbsolute;
		this.isFilterExprContext = options.isFilterExprContext;
		this.isRoot = options.isRoot;
		this.isSelf = options.isSelf;

		this.steps = pathExprSteps(syntaxNode);
	}

	evaluateNodes(context: EvaluationContext): Iterable<Node> {
		if (this.isRoot) {
			return context.rootContext().nodes;
		}

		if (this.isSelf) {
			return context.contextNodes;
		}

		const [contextStep, ...rest] = this.steps;

		let ctx: LocationPathEvaluation;

		switch (contextStep.axisType) {
			case '__ROOT__':
				ctx = context.rootContext();
				break;

			case 'self':
				ctx = context.currentContext();
				break;

			default:
				throw new UnreachableError(contextStep);
		}

		for (const step of rest) {
			ctx = ctx.step(step);

			for (const predicateNode of step.predicates) {
				const [predicateExpressionNode] = predicateNode.children;
				const predicateExpression = createExpression(predicateExpressionNode);

				let positionPredicate: number | null = null;

				if (predicateExpression instanceof NumberExpression) {
					positionPredicate = predicateExpression.evaluate(ctx).toNumber();
				}

				const filteredNodes: Node[] = [];

				for (const self of ctx) {
					if (positionPredicate != null) {
						if (self.contextPosition() === positionPredicate) {
							filteredNodes.push(...self.contextNodes);
							break;
						} else {
							continue;
						}
					}

					const predicateResult = predicateExpression.evaluate(self);

					// TODO: it's surprising there aren't tests exercising this, but it
					// seems pretty likely there would be node cases which should be treated
					// as position predicates? Unclear if numeric strings should as well.
					if (predicateResult.type === 'NUMBER') {
						const evaluatedPositionPredicate = predicateResult.toNumber();

						if (self.contextPosition() === evaluatedPositionPredicate) {
							filteredNodes.push(...self.contextNodes);
						}
					} else if (predicateResult.toBoolean()) {
						filteredNodes.push(...self.contextNodes);
					}
				}

				ctx = LocationPathEvaluation.fromArbitraryNodes(
					ctx,
					(filteredNodes as ContextNode[]).values(),
					this
				);
			}
		}

		return ctx.contextNodes;
	}
}

export type { LocationPathExpression };

class FilterPathExpression extends LocationPathExpression implements ExpressionEvaluator {
	readonly filterExpression: LocationPathExpressionEvaluator;
	readonly hasSteps: boolean;

	constructor(override readonly syntaxNode: FilterPathExprNode) {
		const [filterExprNode, ...rest] = syntaxNode.children;

		super(syntaxNode, {
			isAbsolute: false,
			isFilterExprContext: true,
			isRoot: false,
			isSelf: false,
		});

		this.hasSteps = rest.length > 0;

		const [exprNode] = filterExprNode.children;
		// TODO: possibly an unsafe cast!
		this.filterExpression = createExpression(exprNode) as LocationPathExpressionEvaluator;
	}

	override evaluateNodes(context: EvaluationContext): Iterable<Node> {
		// TODO: this check may not be necessary
		if (this.hasSteps) {
			const filterContextResults = this.filterExpression.evaluate(context);

			if (!(filterContextResults instanceof LocationPathEvaluation)) {
				throw 'todo not a node-set context';
			}

			return super.evaluateNodes(filterContextResults);
		}

		return this.filterExpression.evaluateNodes(context);
	}
}

export type { FilterPathExpression };

class AbsoluteLocationPathExpression extends LocationPathExpression implements ExpressionEvaluator {
	constructor(override readonly syntaxNode: AbsoluteLocationPathNode) {
		const { text } = syntaxNode;
		const isRoot = text === '/';

		super(syntaxNode, {
			isAbsolute: true,
			isFilterExprContext: false,
			isRoot,
			isSelf: false,
		});
	}
}

class RelativeLocationPathExpression extends LocationPathExpression implements ExpressionEvaluator {
	constructor(override readonly syntaxNode: RelativeLocationPathNode) {
		const { text } = syntaxNode;
		const isSelf = text === '.';

		super(syntaxNode, {
			isAbsolute: false,
			isFilterExprContext: false,
			isRoot: false,
			isSelf,
		});
	}
}

class NumberExpression extends NumberExpressionEvaluator<number> implements ExpressionEvaluator {
	constructor(readonly syntaxNode: NumberNode) {
		const { text } = syntaxNode;

		const constValue = Number(text);

		super(constValue);
	}

	evaluateNumber(): number {
		return this.constValue;
	}
}

class StringLiteralExpression
	extends StringExpressionEvaluator<string>
	implements ExpressionEvaluator
{
	constructor(readonly syntaxNode: LiteralNode) {
		const { text } = syntaxNode;
		const constValue = text.substring(1, text.length - 1);

		super(constValue);
	}

	evaluateString(): string {
		return this.constValue;
	}
}

export const createExpression = (syntaxNode: EvaluableExprNode): ExpressionEvaluator => {
	switch (syntaxNode.type) {
		case 'xpath':
		case 'argument': {
			const [evaluableNode] = syntaxNode.children[0].children;

			return createExpression(evaluableNode);
		}

		case 'expr': {
			const [evaluableNode] = syntaxNode.children;

			return createExpression(evaluableNode);
		}

		case 'and_expr':
		case 'eq_expr':
		case 'gt_expr':
		case 'gte_expr':
		case 'lt_expr':
		case 'lte_expr':
		case 'ne_expr':
		case 'or_expr': {
			return new BooleanBinaryExpression(syntaxNode);
		}

		case 'addition_expr':
		case 'division_expr':
		case 'subtraction_expr':
		case 'modulo_expr':
		case 'multiplication_expr': {
			return new NumericBinaryExpression(syntaxNode);
		}

		case 'union_expr': {
			return new UnionExpression(syntaxNode);
		}

		case 'unary_expr': {
			return new UnaryExpression(syntaxNode);
		}

		case 'function_call': {
			return new FunctionCallExpression(syntaxNode);
		}

		case 'absolute_location_path':
			return new AbsoluteLocationPathExpression(syntaxNode);

		case 'filter_path_expr':
			if (syntaxNode.children.length === 1) {
				const [exprNode] = syntaxNode.children[0].children;

				return createExpression(exprNode);
			}

			return new FilterPathExpression(syntaxNode);

		case 'relative_location_path':
			return new RelativeLocationPathExpression(syntaxNode);

		case 'number': {
			return new NumberExpression(syntaxNode);
		}

		case 'string_literal':
			return new StringLiteralExpression(syntaxNode);

		default:
			throw new UnreachableError(syntaxNode);
	}
};
