import type {
	DefaultDOMAdapterNode,
	XFormsSecondaryInstanceElement,
	XFormsSecondaryInstanceMap,
} from '@getodk/xpath';
import type { DOMSecondaryInstanceElement, XFormDOM } from '../../XFormDOM.ts';

/** @todo remove */
// prettier-ignore
type SecondaryInstanceRootDefinition =
	& DOMSecondaryInstanceElement
	& XFormsSecondaryInstanceElement<DefaultDOMAdapterNode>;

/** @todo remove */
interface SecondaryInstanceDefinition {
	readonly root: SecondaryInstanceRootDefinition;
}

export class SecondaryInstancesDefinition
	extends Map<string, SecondaryInstanceRootDefinition>
	implements XFormsSecondaryInstanceMap<DefaultDOMAdapterNode>
{
	static from(xformDOM: XFormDOM): SecondaryInstancesDefinition {
		const definitions = xformDOM.secondaryInstanceElements.map((element) => {
			element satisfies DOMSecondaryInstanceElement;
			const root = element as SecondaryInstanceRootDefinition;

			return { root };
		});

		return new this(definitions);
	}

	private constructor(translations: readonly SecondaryInstanceDefinition[]) {
		super(
			translations.map(({ root }) => {
				return [root.getAttribute('id'), root];
			})
		);
	}
}
