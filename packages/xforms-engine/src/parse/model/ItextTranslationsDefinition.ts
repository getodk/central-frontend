import type {
	XFORMS_KNOWN_ATTRIBUTE,
	XFORMS_LOCAL_NAME,
	XFormsItextTranslationMap,
} from '@getodk/xpath';
import { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { parseStaticDocumentFromDOMSubtree } from '../shared/parseStaticDocumentFromDOMSubtree.ts';
import type { XFormDOM } from '../XFormDOM.ts';

export interface ItextTranslationDefinition extends StaticDocument {
	readonly rootDocument: ItextTranslationDefinition;
	readonly root: ItextTranslationRootDefinition;
}

export interface ItextTranslationRootDefinition extends StaticElement {
	readonly [XFORMS_LOCAL_NAME]: 'translation';
	readonly [XFORMS_KNOWN_ATTRIBUTE]: 'lang';

	readonly root: ItextTranslationRootDefinition;
	readonly rootDocument: ItextTranslationDefinition;
}

type ItextTranslationsDefinitionEntry = readonly [
	key: string,
	value: ItextTranslationRootDefinition,
];

type AssertItextTranslationsDefinitionEntry = (
	entry: readonly [key: string | null, value: StaticElement]
) => asserts entry is ItextTranslationsDefinitionEntry;

const assertItextTranslationsDefinitionEntry: AssertItextTranslationsDefinitionEntry = ([key]) => {
	if (key == null) {
		throw new Error();
	}
};

export class ItextTranslationsDefinition
	extends Map<string, ItextTranslationRootDefinition>
	implements XFormsItextTranslationMap<ItextTranslationRootDefinition>
{
	static from(xformDOM: XFormDOM): ItextTranslationsDefinition {
		const translationDefinitions = xformDOM.itextTranslationElements.map((element) => {
			return parseStaticDocumentFromDOMSubtree(element);
		});

		return new this(translationDefinitions);
	}

	private constructor(translations: readonly StaticDocument[]) {
		super(
			translations.map(({ root }) => {
				const entry = [root.getAttributeValue('lang'), root] as const;

				assertItextTranslationsDefinitionEntry(entry);

				return entry;
			})
		);
	}
}
