import { XFORMS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { QualifiedName } from './QualifiedName.ts';

export class UnprefixedXFormsName extends QualifiedName {
	constructor(localName: string) {
		super({
			namespaceURI: XFORMS_NAMESPACE_URI,
			prefix: null,
			localName,
		});
	}
}
