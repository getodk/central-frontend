import type {
	XFORMS_KNOWN_ATTRIBUTE,
	XFORMS_LOCAL_NAME,
	XFormsItextTranslationMap,
} from '@getodk/xpath';
import { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { XFormDOM } from '../XFormDOM.ts';
import { parseStaticDocumentFromDOMSubtree } from '../shared/parseStaticDocumentFromDOMSubtree.ts';

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

const assertItextTranslationsDefinitionEntry: AssertItextTranslationsDefinitionEntry = ([
	key,
	root,
]) => {
	if (key == null || root.qualifiedName.localName !== 'translation') {
		throw new Error();
	}
};

/**
 * @todo At time of writing, this shouldn't have any observable
 * consequence—apart from preventing the potential mistake of using an
 * {@link ItextTranslationDefinition} where an
 * **instance**-as-{@link StaticDocument} would be expected (i.e. anything
 * expecting an instance's {@link StaticDocument.nodeset} to be '/', or an its
 * descendant elements' {@link StaticElement.nodeset} to start with '/'). The
 * main intent, however, is to leave a breadcrumb back to ideas discussed in
 * {@link https://github.com/getodk/web-forms/issues/22#issuecomment-2669228571 | Allow output in translation text (#22)}.
 */
const itextTranslationNodesetPrefix = (lang: string) => {
	return `wf:translation('${lang}')`;
};

export class ItextTranslationsDefinition
	extends Map<string, ItextTranslationRootDefinition>
	implements XFormsItextTranslationMap<ItextTranslationRootDefinition>
{
	static from(xformDOM: XFormDOM): ItextTranslationsDefinition {
		const entries = xformDOM.itextTranslationElements.map((element) => {
			const lang = element.getAttribute('lang');
			const { root } = parseStaticDocumentFromDOMSubtree(element, {
				nodesetPrefix: itextTranslationNodesetPrefix(lang),
			});
			const entry = [lang, root] as const;

			assertItextTranslationsDefinitionEntry(entry);

			return entry;
		});

		return new this(entries);
	}

	private constructor(entries: readonly ItextTranslationsDefinitionEntry[]) {
		super(entries);
	}
}
