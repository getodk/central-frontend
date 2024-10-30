import { normalizeXMLXPathWhitespace } from '@getodk/common/lib/string/whitespace.ts';
import { reduce } from 'itertools-ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import { NodeSetFunction } from '../../evaluator/functions/NodeSetFunction.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';

const { toCount } = reduce;

export const count = new NumberFunction(
	'count',
	[{ arityType: 'required' }],
	(context, [expression]): number => {
		const results = expression!.evaluate(context);

		if (results.nodes == null) {
			throw 'todo not a node-set';
		}

		return toCount(results.nodes);
	}
);

export const current = new NodeSetFunction('current', [], (context) => {
	return [context.evaluationContextNode];
});

export const id = new NodeSetFunction(
	'id',
	[{ arityType: 'required' }],
	(context, [expression]) => {
		const idArgument = expression!.evaluate(context);
		const idArguments = idArgument.type === 'NODE' ? Array.from(idArgument) : [idArgument.first()];
		const elementIds = Array.from(
			new Set(
				idArguments.flatMap((argument) =>
					normalizeXMLXPathWhitespace(argument?.toString() ?? '').split(' ')
				)
			)
		);

		if (elementIds.length === 0) {
			return [];
		}

		const { contextDocument, domProvider } = context;
		const elements = elementIds.flatMap((elementId) => {
			const element = domProvider.getElementByUniqueId(contextDocument, elementId);

			if (element == null) {
				return [];
			}

			return element;
		});

		return context.domProvider.sortInDocumentOrder(elements);
	}
);

export const last = new NumberFunction('last', [], (context): number => context.contextSize());

export const localName = new StringFunction(
	'local-name',
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

		const { domProvider } = context;

		if (domProvider.isQualifiedNamedNode(node)) {
			return domProvider.getLocalName(node);
		}

		if (domProvider.isProcessingInstruction(node)) {
			return domProvider.getProcessingInstructionName(node);
		}

		return '';
	}
);

export const name = new StringFunction(
	'name',
	[{ arityType: 'optional' }],
	(context, [expression]) => {
		const evaluated = expression?.evaluate(context) ?? context;

		if (!(evaluated instanceof LocationPathEvaluation)) {
			throw 'todo not a node-set';
		}

		const node = evaluated.first()?.value;

		if (node == null) {
			return '';
		}

		const { domProvider } = context;

		if (domProvider.isQualifiedNamedNode(node)) {
			return domProvider.getQualifiedName(node);
		}

		if (domProvider.isProcessingInstruction(node)) {
			return domProvider.getProcessingInstructionName(node);
		}

		return '';
	}
);

export const namespaceURI = new StringFunction(
	'namespace-uri',
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

		const { domProvider } = context;

		if (domProvider.isQualifiedNamedNode(node)) {
			return domProvider.getNamespaceURI(node) ?? '';
		}

		return '';
	}
);

export const position = new NumberFunction('position', [], (context): number =>
	context.contextPosition()
);
