import { UnreachableError } from '@getodk/common/lib/error/UnreachableError';
import { expressionParser } from '@getodk/xpath/expressionParser.js';
import type {
	AbsoluteLocationPathNode,
	AnyBinaryExprNode,
	AnySyntaxNode,
	FilterPathExprNode,
	LocalPartNode,
	PrefixedNameNode,
	RelativeLocationPathNode,
	UnprefixedNameNode,
} from '@getodk/xpath/static/grammar/SyntaxNode.js';
import type { AnyBinaryExprType } from '@getodk/xpath/static/grammar/type-names.js';

export type SingleChildNode = Extract<
	AnySyntaxNode,
	{ readonly children: readonly [AnySyntaxNode] }
>;

const isSingleNodeChild = (node: AnySyntaxNode): node is SingleChildNode => {
	return node.childCount === 1;
};

const binaryExprNodeTypes = new Set<AnyBinaryExprType>([
	'addition_expr',
	'and_expr',
	'division_expr',
	'eq_expr',
	'gt_expr',
	'gte_expr',
	'lt_expr',
	'lte_expr',
	'modulo_expr',
	'multiplication_expr',
	'ne_expr',
	'or_expr',
	'subtraction_expr',
	'union_expr',
]);

const isBinaryExprNode = (node: AnySyntaxNode): node is AnyBinaryExprNode => {
	return binaryExprNodeTypes.has(node.type as AnyBinaryExprType);
};

const matchesLocalName = (
	localName: string,
	nameNode: PrefixedNameNode | UnprefixedNameNode
): boolean => {
	const localPartNode: LocalPartNode | UnprefixedNameNode =
		nameNode.type === 'prefixed_name' ? nameNode.children[1] : nameNode;

	return localPartNode.text === localName;
};

const isFunctionCalled = (localName: string, node: AnySyntaxNode): boolean => {
	if (!node.text.includes(localName)) {
		return false;
	}

	if (isSingleNodeChild(node)) {
		const [child] = node.children;

		return isFunctionCalled(localName, child);
	}

	if (isBinaryExprNode(node)) {
		const [lhs, rhs] = node.children;

		return isFunctionCalled(localName, lhs) || isFunctionCalled(localName, rhs);
	}

	switch (node.type) {
		// Terminal nodes
		case 'number':
		case 'string_literal':
		case 'variable_reference':

		// Path sub-nodes which could not have a function call child
		//
		// This only errors because this set of cases is commented:
		// eslint-disable-next-line no-fallthrough
		case '//':
		case 'absolute_root_location_path':
		case 'axis_name':
		case 'node_type_test':
		case 'parent':
		case 'self':

		// Name nodes are also not function call parents
		//
		// This only errors because this set of cases is commented:
		// eslint-disable-next-line no-fallthrough
		case 'local_part':
		case 'prefixed_name':
		case 'prefix':
		case 'unprefixed_name':
		case 'unprefixed_wildcard_name_test':
			return false;

		// Path sub-nodes which could have a function call child
		case 'abbreviated_absolute_location_path':
		case 'abbreviated_step':
		case 'absolute_location_path':
		case 'axis_test':
		case 'filter_path_expr':
		case 'relative_location_path':
		case 'step':
			return node.children.some((childNode) => isFunctionCalled(localName, childNode));

		case 'function_call': {
			const [functionNameNode] = node.children;
			const [nameNode] = functionNameNode.children;

			return matchesLocalName(localName, nameNode);
		}

		default:
			throw new UnreachableError(node);
	}
};

export const isItextFunctionCalled = (expression: string): boolean => {
	const { rootNode } = expressionParser.parse(expression);

	return isFunctionCalled('itext', rootNode);
};

type LocationPathSubExpressionNode =
	| AbsoluteLocationPathNode
	| FilterPathExprNode
	| RelativeLocationPathNode;

const isAnyLocationPathExprNode = (node: AnySyntaxNode): node is LocationPathSubExpressionNode => {
	const { type } = node;

	if (type === 'absolute_location_path' || type === 'relative_location_path') {
		return true;
	}

	return false;
};

// TODO: this does not currently even attempt to find sub-expressions nested
// within sub-expressions.
const findLocationPathExprNodes = (
	node: AnySyntaxNode
): readonly LocationPathSubExpressionNode[] => {
	const results: LocationPathSubExpressionNode[] = [];

	if (isAnyLocationPathExprNode(node)) {
		results.push(node);
	}

	results.push(
		...node.children.flatMap((childNode) => {
			return findLocationPathExprNodes(childNode);
		})
	);

	return results;
};

// TODO: this is a very small subset of resolution that needs to be supported,
// and it's a hamfisted hack. **This is temporary** to unblock progress on
// computations, but a longer term solution will need to address:
//
// - non-abbreviation axes (parent, child, self) according to XForms spec
// - non-leading axes
// - context expressions which are more complex than a series of explicit
//   element name test steps (this may be fine for binds!)
const resolveRelativeSubExpression = (contextReference: string | null, expression: string) => {
	if (contextReference == null) {
		return expression;
	}

	const [, axisAbbreviation, relativeExpression = ''] = expression.match(/^(\.{1,2})(\/.*$)?/) ?? [
		null,
		'',
		expression,
	];

	switch (axisAbbreviation) {
		case '':
			return expression;

		case '.':
			return `${contextReference}${relativeExpression}`;

		case '..':
			return `${contextReference.replace(/\/[^/]+$/, '')}${relativeExpression}`;
	}

	throw new Error(`Unexpected relative expression: ${expression}`);
};

interface GetNodesetDependenciesOptions {
	readonly contextReference?: string | null;

	/**
	 * @default false
	 */
	readonly ignoreContextReference?: boolean;

	/**
	 * Ignores location path sub-expressions whose full text is `null`. While this
	 * is technically a valid relative name test step, it seems that real forms in
	 * the wild use it as if XPath had an actual `null` token/value.
	 *
	 * @default true
	 */
	readonly ignoreNullExpressions?: boolean;
}

export const getNodesetDependencies = (
	expression: string,
	options: GetNodesetDependenciesOptions = {}
): Set<string> => {
	const { rootNode } = expressionParser.parse(expression);
	const subExpressionNodes = findLocationPathExprNodes(rootNode);
	const {
		contextReference = null,
		ignoreContextReference = false,
		ignoreNullExpressions = true,
	} = options;

	const subExpressions = subExpressionNodes
		.map((syntaxNode) => resolveRelativeSubExpression(contextReference, syntaxNode.text))
		.filter((subExpression) => {
			if (ignoreContextReference && subExpression === contextReference) {
				return false;
			}

			if (ignoreNullExpressions && subExpression === 'null') {
				return false;
			}

			return true;
		});

	return new Set(subExpressions);
};
