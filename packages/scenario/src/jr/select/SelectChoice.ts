import type { SelectItem } from '@getodk/xforms-engine';
import { ComparableChoice } from '../../choice/ComparableChoice.ts';
import { UnclearApplicabilityError } from '../../error/UnclearApplicabilityError.ts';
import type { SelectChoiceArbitraryChildList } from './SelectChoiceArbitraryChildList.ts';

export class SelectChoice extends ComparableChoice {
	get value(): string {
		return this.selectItem.value;
	}

	get label(): string | null {
		return this.selectItem.label?.asString ?? null;
	}

	constructor(protected readonly selectItem: SelectItem) {
		super();
	}

	/**
	 * @todo This appears to have been introduced in JavaRosa to support GeoJSON
	 * functionality. The
	 * {@link https://github.com/getodk/javarosa/pull/660 | pull request}
	 * describes the intent to support accessing a well-known `geometry` child by
	 * name. There are other tests, however, referencing arbitrary children by
	 * name as well. This is currently unimplemented (and will cause failures in
	 * tests accessing it, even if other functionality is introduced to unblock
	 * code paths leading to its access) until we deem it appropriate to address.
	 */
	getChild(_childName: string): string | null {
		throw new UnclearApplicabilityError(
			'select choice: getting arbitrary child of secondary instance nodes by name'
		);
	}

	getAdditionalChildren(): SelectChoiceArbitraryChildList {
		throw new UnclearApplicabilityError(
			`select choice: getting arbitrary children of secondary instance nodes`
		);
	}

	getValue(): string {
		return this.value;
	}
}
