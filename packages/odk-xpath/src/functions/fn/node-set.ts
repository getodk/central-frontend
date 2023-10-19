import { reduce } from 'itertools-ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { isNamespaceNode, isProcessingInstructionNode } from '../../lib/dom/predicates.ts';
import { sortDocumentOrder } from '../../lib/dom/sort.ts';
import { normalizeXPathWhitespace } from '../_shared/string.ts';
import { NodeSetFunction } from '../../evaluator/functions/NodeSetFunction.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type { MaybeNamedNode } from '../../lib/dom/types.ts';

const { toCount } = reduce;

export const count = new NumberFunction(
	[{ arityType: 'required' }],
	(context, [expression]): number => {
		const results = expression!.evaluate(context);

		if (results.nodes == null) {
			throw 'todo not a node-set';
		}

		return toCount(results.nodes);
	}
);

export const id = new NodeSetFunction(
	[{ arityType: 'required' }],
	(context, [expression]): Iterable<Node> => {
		const idArgument = expression!.evaluate(context);
		const idArguments = idArgument.type === 'NODE' ? Array.from(idArgument) : [idArgument.first()];
		const elementIds = Array.from(
			new Set(
				idArguments.flatMap((argument) =>
					normalizeXPathWhitespace(argument?.toString() ?? '').split(' ')
				)
			)
		);

		if (elementIds.length === 0) {
			return [];
		}

		const { contextDocument } = context;
		const elements = elementIds.flatMap((elementId) => {
			const element = contextDocument.getElementById(elementId);

			if (element == null) {
				return [];
			}

			return element;
		});

		return sortDocumentOrder(elements);
	}
);

export const last = new NumberFunction([], (context, []): number => context.contextSize());

export const localName = new StringFunction(
	[{ arityType: 'optional' }],
	(context, [expression]): string => {
		const evaluated = expression?.evaluate(context) ?? context;

		if (!(evaluated instanceof LocationPathEvaluation)) {
			throw 'todo not a node-set';
		}

		const node = evaluated.first()?.value;

		if (node == null) {
			return '';
		}

		if (
			node.nodeType !== Node.ELEMENT_NODE &&
			node.nodeType !== Node.ATTRIBUTE_NODE &&
			node.nodeType !== Node.PROCESSING_INSTRUCTION_NODE
		) {
			return '';
		}

		const name = isNamespaceNode(node)
			? ''
			: isProcessingInstructionNode(node)
			? node.nodeName
			: (node as MaybeNamedNode).localName ?? '';

		return name;
	},
	{ localName: 'local-name' }
);

export const name = new StringFunction([{ arityType: 'optional' }], (context, [expression]) => {
	const evaluated = expression?.evaluate(context) ?? context;

	if (!(evaluated instanceof LocationPathEvaluation)) {
		throw 'todo not a node-set';
	}

	const node = evaluated.first()?.value;

	if (node == null) {
		return '';
	}

	if (
		node.nodeType !== Node.ELEMENT_NODE &&
		node.nodeType !== Node.ATTRIBUTE_NODE &&
		node.nodeType !== Node.PROCESSING_INSTRUCTION_NODE
	) {
		return '';
	}

	if (isNamespaceNode(node)) {
		return '';
	}

	return (node as MaybeNamedNode).nodeName ?? '';
});

export const namespaceURI = new StringFunction(
	[{ arityType: 'optional' }],
	(context, [expression]): string => {
		const evaluated = expression?.evaluate(context) ?? context;

		if (!(evaluated instanceof LocationPathEvaluation)) {
			throw 'todo not a node-set';
		}

		const node = evaluated.first()?.value;

		if (node == null) {
			return '';
		}

		if (isNamespaceNode(node)) {
			return '';
		}

		return (node as MaybeNamedNode).namespaceURI ?? '';
	},
	{ localName: 'namespace-uri' }
);

export const position = new NumberFunction([{ arityType: 'optional' }], (context, []): number =>
	context.contextPosition()
);
