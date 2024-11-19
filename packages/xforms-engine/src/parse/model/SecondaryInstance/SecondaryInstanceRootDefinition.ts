import type { XFormsSecondaryInstanceElement } from '@getodk/xpath';
import { XFORMS_KNOWN_ATTRIBUTE, XFORMS_LOCAL_NAME } from '@getodk/xpath';
import { StaticElement } from '../../../integration/xpath/static-dom/StaticElement.ts';
import type { SecondaryInstanceDefinition } from './SecondaryInstanceDefinition.ts';

export class SecondaryInstanceRootDefinition
	extends StaticElement<SecondaryInstanceDefinition>
	implements XFormsSecondaryInstanceElement<StaticElement>
{
	override readonly [XFORMS_LOCAL_NAME] = 'instance';
	override readonly [XFORMS_KNOWN_ATTRIBUTE] = 'id';
}
