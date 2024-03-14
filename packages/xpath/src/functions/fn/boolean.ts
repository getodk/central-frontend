import { XML_NAMESPACE_URI } from '../../evaluator/NamespaceResolver.ts';
import { BooleanFunction } from '../../evaluator/functions/BooleanFunction.ts';
import { isElementNode } from '../../lib/dom/predicates.ts';

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

		let contextElement = isElementNode(contextNode) ? contextNode : contextNode.parentElement;

		if (contextElement == null) {
			return false;
		}

		let langValue: string | null = contextElement.getAttributeNS(XML_NAMESPACE_URI, 'lang');

		do {
			langValue = contextElement?.getAttributeNS(XML_NAMESPACE_URI, 'lang')?.toLowerCase() ?? null;
			contextElement = contextElement.parentElement;
		} while (langValue == null && contextElement != null);

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
