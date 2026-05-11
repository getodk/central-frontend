import { XML_NAMESPACE_URI } from '../../evaluator/NamespaceResolver.ts';
import { BooleanFunction } from '../../evaluator/functions/BooleanFunction.ts';

const falseFn = new BooleanFunction('false', [], (): boolean => false);

export { falseFn as false };

const trueFn = new BooleanFunction('true', [], (): boolean => true);

export { trueFn as true };

export const boolean = new BooleanFunction(
	'boolean',
	[{ arityType: 'required' }],
	(context, [expression]): boolean => {
		return expression!.evaluate(context).toBoolean();
	}
);

export const lang = new BooleanFunction(
	'lang',
	[{ arityType: 'required' }],
	(context, [expression]): boolean => {
		const language = expression!.evaluate(context).toString().toLowerCase();

		if (language === '') {
			return false;
		}

		// TODO: what happens with multiple? Probably use `some`?
		const [contextNode] = context.contextNodes;

		if (contextNode == null) {
			return false;
		}

		const { domProvider } = context;

		let currentContextNode = domProvider.isElement(contextNode)
			? contextNode
			: domProvider.getParentNode(contextNode);

		if (currentContextNode == null) {
			return false;
		}

		let langValue: string | null = null;

		do {
			if (currentContextNode == null || !domProvider.isElement(currentContextNode)) {
				break;
			}

			langValue =
				domProvider
					.getQualifiedNamedAttributeValue(currentContextNode, XML_NAMESPACE_URI, 'lang')
					?.toLowerCase() ?? null;

			currentContextNode = domProvider.getParentNode(currentContextNode);
		} while (langValue == null && currentContextNode != null);

		return langValue != null && (langValue === language || langValue.startsWith(`${language}-`));
	}
);

export const not = new BooleanFunction(
	'not',
	[{ arityType: 'required' }],
	(context, [expression]): boolean => {
		return !expression!.evaluate(context).toBoolean();
	}
);
