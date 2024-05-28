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
	 * **PORTING NOTES**
	 *
	 * This was
	 * {@link https://github.com/getodk/javarosa/pull/660 | introduced in JavaRosa to support geo functionality}.
	 * The method may access a well-known `geometry` child (or any arbitrary
	 * child) by name,
	 * {@link https://github.com/getodk/web-forms/pull/110#discussion_r1610611805 | where}…
	 *
	 * > Could be a repeat, a secondary instance or an external secondary instance
	 * > (csv, xml or geojson). The `map` appearance that uses the `geometry`
	 * > child for mapping works identically for all of those.
	 *
	 * @todo This is currently unimplemented (and will cause failures in tests
	 * accessing it, even if other functionality is introduced to unblock code
	 * paths leading to its access) until we deem it appropriate to address.
	 * Addressing it will likely involve understanding how it relates to and/or
	 * affected tests can be expressed at an integration level.
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
