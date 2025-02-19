import type { XFormsItextTranslationElement } from '@getodk/xpath';
import { XFORMS_KNOWN_ATTRIBUTE, XFORMS_LOCAL_NAME } from '@getodk/xpath';
import { StaticElement } from '../../../integration/xpath/static-dom/StaticElement.ts';
import type { ItextTranslationDefinition } from './ItextTranslationDefinition.ts';

// prettier-ignore
type ItextTranslationRootKnownAttributeValue<LocalName extends string> =
	LocalName extends 'lang'
		? string
		: string | null;

type AssertItextTranslationRootKnownAttributeValue = <LocalName extends string>(
	localName: LocalName,
	value: string | null
) => asserts value is ItextTranslationRootKnownAttributeValue<LocalName>;

const assertItextTranslationRootKnownAttributeValue: AssertItextTranslationRootKnownAttributeValue =
	(localName, value) => {
		if (localName === 'lang' && value == null) {
			throw new Error('Invalid itext <translation> element: missing `lang` attribute');
		}
	};

export class ItextTranslationRootDefinition
	extends StaticElement<ItextTranslationDefinition>
	implements XFormsItextTranslationElement<ItextTranslationRootDefinition>
{
	override readonly [XFORMS_LOCAL_NAME] = 'translation';
	override readonly [XFORMS_KNOWN_ATTRIBUTE] = 'lang';

	override getAttributeValue(localName: 'lang'): string;
	override getAttributeValue(localName: string): string | null;
	override getAttributeValue<LocalName extends string>(
		localName: LocalName
	): ItextTranslationRootKnownAttributeValue<LocalName> {
		const value = super.getAttributeValue(localName);

		assertItextTranslationRootKnownAttributeValue(localName, value);

		return value;
	}
}
