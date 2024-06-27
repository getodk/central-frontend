import { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { afterEach, it as baseIt, describe, expect } from 'vitest';
import { LocalDate } from '../../src/java/time/LocalDate.ts';
import { Consumer } from '../../src/java/util/function/Consumer.ts';
import { Scenario as BaseScenario } from '../../src/jr/Scenario.ts';
import type { EndOfFormEvent } from '../../src/jr/event/EndOfFormEvent.ts';
import type { PositionalEvent } from '../../src/jr/event/PositionalEvent.ts';
import type {
	AnyPositionalEvent,
	NonTerminalPositionalEvent,
} from '../../src/jr/event/getPositionalEvents.ts';
import { JRTreeReference as BaseJRTreeReference } from '../../src/jr/xpath/JRTreeReference.ts';

/**
 * **PORTING NOTES**
 *
 * This smoke test is intentionally ported in an incomplete state, pending
 * progress on whichever aspects of functionality are currently blocking it from
 * proceeding. Its incompleteness is an acknowledgement that the set of blocking
 * functionality is not presently known, and that the effort to complete it will
 * be better spent as each terminal blocker is cleared, revealing any remaining
 * blockers as they arise.
 *
 * To the extent possible, it's been ported in a way to make updating it
 * relatively straightforward as the features it depends on become available.
 *
 * The test itself is currently fibbing about its status: it passes, with a call
 * to a locally assigned {@link it.fails}. This allows us to identify the
 * **current expected failure mode**, prompting updates to the test when that
 * known failure mode changes.
 *
 * @todo We'd benefit here and in many other cases from being able to express
 * these semantics with the real {@link baseIt.fails | `it.fails`} API. We
 * should consider whether there is a way to achieve that without fibbing, and
 * possibly file an issue with Vitest if not.
 */
class IncompleteTestPortError extends Error {
	constructor(pendingFunctionality: string) {
		const message = [
			'Test port is incomplete. If this error condition has been reached, some aspect previously blocking the test from proceeding is no longer blocking it! Update the test to proceed through the remaining unblocked steps.',
			`Pending functionality: ${pendingFunctionality}`,
		].join('\n\n');

		super(message);
	}
}

const it = {
	fails: baseIt,
};

const refSingletons = new UpsertableMap<string, JRTreeReference>();

class JRTreeReference extends BaseJRTreeReference {
	genericize(): JRTreeReference {
		throw new IncompleteTestPortError('TreeReference.genericize');
	}

	equals(other: JRTreeReference): boolean {
		return this.xpathReference === other.xpathReference;
	}

	override toString(includePredicates: true, zeroIndexMult: true): string {
		throw new IncompleteTestPortError(
			`Pending - cast to string with includePredicates: ${includePredicates}, zeroIndexMult: ${zeroIndexMult}`
		);
	}
}

const getRef = (xpathReference: string): JRTreeReference => {
	return new JRTreeReference(xpathReference);
};

class MissingExpectedReferenceAssertionError extends Error {
	constructor(currentPositionalEvent: AnyPositionalEvent) {
		const currentReference =
			currentPositionalEvent.eventType === 'END_OF_FORM'
				? currentPositionalEvent.eventType
				: currentPositionalEvent.node.currentState.reference;

		const message = [
			'Call to `Scenario.next` should specify the reference expected for the next `PositionalEvent`.',
			`The current positional reference is: ${currentReference}`,
			'Inspect the test form fixture to determine which reference is expected to follow that.',
		].join('\n\n');

		super(message);
	}
}

/**
 * **PORTING NOTES**
 *
 * This subclass defines extendsions of the
 * {@link BaseScenario | base `Scenario` class} which are only used in
 * JavaRosa's equivalent of this smoketest, and benchmarks of the same form
 * under test. The extensions in question feel questionable for proliferation in
 * the `@getodk/scenario` package writ large. They're ported here for fidelity
 * of the initial direct port. Each member extending the base class includes
 * additional notes.
 *
 * We've deferred porting benchmarks for now, so it makes some sense to keep
 * this subclass module local. When we do port JavaRosa's benchmarks, we should
 * consider how we might organize this special case (and potentially others like
 * it which we might encounter in this final push of the first porting pass).
 */
class Scenario extends BaseScenario {
	/**
	 * @deprecated
	 *
	 * We already have good reason to consider how we might want to control
	 * logging (verbosity, output target, inspectability), and this should serve
	 * as a prompt to consider how we might do so in a way that's at least
	 * plausibly portable, and consider migrating current uses of this method to
	 * that solution.
	 */
	trace(msg: string): void {
		/* eslint-disable no-console */
		console.info('='.repeat(79));
		console.info('       ' + msg);
		console.info('='.repeat(79));
		/* eslint-enable no-console */
	}

	/**
	 * @deprecated
	 *
	 * As this is only used in tests/benchmarks of this smoke test form fixture,
	 * it's worth considering the intended usage in isolation. Specifically, it is
	 * used for:
	 *
	 * 1. Iteration through {@link PositionalEvent}s to a target, with predicate
	 *    logic for its identification.
	 *
	 * 2. Positional reference assertions which disregard repeat position (e.g.
	 *    `/data/rep[1]` passes when compared to `/data/rep[42]`, but not when
	 *    compared to `/data/other-rep[1]`).
	 *
	 * The former seems like a candidate for a more dedicated navigation API. The
	 * latter seems like a potential candidate for a custom assertion with
	 * increased clarity of intent.
	 */
	nextRef(): JRTreeReference {
		throw new IncompleteTestPortError('Extended Scenario.nextRef');
	}

	/**
	 * @deprecated
	 *
	 * Currently wraps underlying {@link BaseScenario.refAtIndex} to produce
	 * the locally extended {@link JRTreeReference} subclass. To what extent can
	 * we eliminate the use of those extensions?
	 */
	override refAtIndex(): JRTreeReference {
		const base = super.refAtIndex();

		return new JRTreeReference(base.xpathReference);
	}

	/**
	 * @deprecated
	 *
	 * This is intended to be a temporary relaxation of the
	 * {@link BaseScenario.next} signature, allowing incomplete steps in the test
	 * to be resolved in future iterations on the underlying functionality
	 * currently blocking the test from proceeding. Once the test is complete,
	 * it's expected that this method will no longer be called without an
	 * {@link expectReference} argument, at which point it should be removed.
	 */
	override next(expectReference?: string): EndOfFormEvent | NonTerminalPositionalEvent {
		if (expectReference == null) {
			const currentPositionalEvent = this.getSelectedPositionalEvent();

			throw new MissingExpectedReferenceAssertionError(currentPositionalEvent);
		}

		return super.next(expectReference);
	}
}

const DOB_DAY_MONTH_TYPE_1_REF = getRef('/data/household/child_repeat/dob_day_1');
const DOB_DAY_MONTH_TYPE_2_REF = getRef('/data/household/child_repeat/dob_day_2');
const DOB_DAY_MONTH_TYPE_3_REF = getRef('/data/household/child_repeat/dob_day_3');
const DOB_DAY_MONTH_TYPE_4_REF = getRef('/data/household/child_repeat/dob_day_4');
const DOB_AGE_IN_MONTHS_REF = getRef('/data/household/child_repeat/age_months');
const VACCINATION_PENTA1_REF = getRef('/data/household/child_repeat/penta1');
const VACCINATION_PENTA3_REF = getRef('/data/household/child_repeat/penta3');
const VACCINATION_MEASLES_REF = getRef('/data/household/child_repeat/mcv1');
const CHILD_REPEAT_REF = getRef('/data/household/child_repeat');
const NOT_ELIG_NOTE_REF = getRef('/data/household/child_repeat/not_elig_note');
const NEXT_CHILD_REF = getRef('/data/household/child_repeat/nextChild');
const NEXT_CHILD_NO_MOTHER_REF = getRef('/data/household/child_repeat/nextChild_no_mother');
const NEW_HOUSEHOLD_REPEAT_JUNCTION_REF = getRef('/data/household');
const FINAL_FLAT_REF = getRef('/data/household/finalflat');
const FINISHED_FORM_REF = getRef('/data/household/finished2');
const TODAY = LocalDate.now();

enum HealthRecordValue {
	HEALTH_HANDBOOK = 'HEALTH_HANDBOOK',
	VACCINATION_CARD = 'VACCINATION_CARD',
	HEALTH_CLINIC = 'HEALTH_CLINIC',
}

class HealthRecord {
	static all(): readonly HealthRecord[] {
		return Object.values(HealthRecordValue).map((value) => {
			return new HealthRecord(value);
		});
	}

	constructor(readonly value: HealthRecordValue) {}

	visit(scenario: Scenario): void {
		const { value } = this;

		switch (value) {
			case HealthRecordValue.HEALTH_HANDBOOK:
				scenario.next();
				scenario.answer('yes');
				break;

			case HealthRecordValue.VACCINATION_CARD:
				scenario.next();
				scenario.answer('no');
				scenario.next();
				scenario.answer('yes');
				break;

			case HealthRecordValue.HEALTH_CLINIC:
				scenario.next();
				scenario.answer('no');
				scenario.next();
				scenario.answer('no');
				scenario.next();
				scenario.answer('yes');
				break;

			default:
				throw new UnreachableError(value);
		}
	}
}

enum Sexes {
	FEMALE = 'female',
	MALE = 'male',
}

class Sex {
	readonly sex: Sexes;

	constructor(private readonly name: `${Sexes}`) {
		switch (name) {
			case 'female':
				this.sex = Sexes.FEMALE;
				break;

			case 'male':
				this.sex = Sexes.MALE;
				break;

			default:
				throw new UnreachableError(name);
		}
	}

	getName(): string {
		return this.name;
	}
}

const FEMALE = new Sex(Sexes.FEMALE);
const MALE = new Sex(Sexes.MALE);

interface VaccineOptions {
	readonly diphteriaFirst: boolean;
	readonly diphteriaThird: boolean;
	readonly measles: boolean;
}

class Vaccine implements VaccineOptions {
	static END_OF_VISIT_REFS = [NEXT_CHILD_REF, FINAL_FLAT_REF, CHILD_REPEAT_REF] as const;

	readonly diphteriaFirst: boolean;
	readonly diphteriaThird: boolean;
	readonly measles: boolean;

	constructor(options: VaccineOptions) {
		this.diphteriaFirst = options.diphteriaFirst;
		this.diphteriaThird = options.diphteriaThird;
		this.measles = options.measles;
	}

	visit(scenario: Scenario): void {
		const { diphteriaFirst, diphteriaThird, measles } = this;
		// Answer questions until there's no more vaccination related questions
		while (!Vaccine.END_OF_VISIT_REFS.includes(scenario.nextRef().genericize())) {
			scenario.next();

			if (scenario.refAtIndex().genericize().equals(VACCINATION_PENTA1_REF)) {
				scenario.answer(diphteriaFirst ? 'yes' : 'no');
			} else if (scenario.refAtIndex().genericize().equals(VACCINATION_PENTA3_REF)) {
				scenario.answer(diphteriaThird ? 'yes' : 'no');
			} else if (scenario.refAtIndex().genericize().equals(VACCINATION_MEASLES_REF)) {
				scenario.answer(measles ? 'yes' : 'no');
			}
		}
	}
}

type Vaccines = Vaccine;

/**
 * Named `NONE` in JavaRosa. More specific name applied here for clarity.
 */
const NO_VACCINES = new Vaccine({
	diphteriaFirst: false,
	diphteriaThird: false,
	measles: false,
});
const DIPHTERIA_FIRST = new Vaccine({
	diphteriaFirst: true,
	diphteriaThird: false,
	measles: false,
});
const DIPHTERIA = new Vaccine({
	diphteriaFirst: true,
	diphteriaThird: true,
	measles: false,
});
const MEASLES = new Vaccine({
	diphteriaFirst: false,
	diphteriaThird: false,
	measles: true,
});
const DIPHTERIA_FIRST_AND_MEASLES = new Vaccine({
	diphteriaFirst: true,
	diphteriaThird: false,
	measles: true,
});
const DIPHTERIA_AND_MEASLES = new Vaccine({
	diphteriaFirst: true,
	diphteriaThird: true,
	measles: true,
});

const answerAgeInMonths = (scenario: Scenario, ageInMonths: number): void => {
	// Is DoB known?
	scenario.next();
	scenario.answer('no');

	// Age in months
	scenario.next();
	scenario.answer(ageInMonths);
};

const answerChild_ageInMonths = (
	scenario: Scenario,
	healthRecord: HealthRecord,
	ageInMonths: number,
	vaccines: Vaccines,
	sex: Sex
): Consumer<number> => {
	return new Consumer((i) => {
		const name = `CHILD ${i} - Age ${ageInMonths} months - ${sex.getName()}`;

		scenario.trace(name);
		scenario.next();
		scenario.next();
		scenario.answer(name);
		healthRecord.visit(scenario);
		scenario.next();
		scenario.answer(sex.getName());

		answerAgeInMonths(scenario, ageInMonths);

		if (scenario.nextRef().genericize().equals(VACCINATION_PENTA1_REF)) {
			vaccines.visit(scenario);
		}

		if ([NEXT_CHILD_REF, NEXT_CHILD_NO_MOTHER_REF].includes(scenario.nextRef().genericize())) {
			scenario.next();
		} else if (!scenario.nextRef().genericize().equals(FINAL_FLAT_REF)) {
			expect.fail('Unexpected next ref ' + scenario.nextRef().toString(true, true) + ' at index');
		}
	});
};

const answerDateOfBirth = (scenario: Scenario, dob: LocalDate): void => {
	// Is DoB known?
	scenario.next();
	scenario.answer('yes');

	// Year in DoB
	scenario.next();
	scenario.answer(dob.year() /* .getYear() */);

	// Month in DoB
	scenario.next();
	scenario.answer(dob.monthValue() /* .getMonthValue() */);

	// Day in DoB
	scenario.next();
	scenario.answer(dob.dayOfMonth() /* .getDayOfMonth() */);
};

const answerChild_dob = (
	scenario: Scenario,
	healthRecord: HealthRecord,
	dob: LocalDate,
	vaccines: Vaccines,
	sex: Sex
): Consumer<number> => {
	return new Consumer((i) => {
		const ageInMonths = dob.until(TODAY).months(); /* .getMonths() */
		const name = `CHILD ${i} - Age ${ageInMonths} months - ${sex.getName()}`;

		scenario.trace(name);
		scenario.next();
		scenario.next();
		scenario.answer(name);
		healthRecord.visit(scenario);
		scenario.next();
		scenario.answer(sex.getName());

		answerDateOfBirth(scenario, dob);

		if (scenario.nextRef().genericize().equals(NOT_ELIG_NOTE_REF)) {
			scenario.next();
		} else if (scenario.nextRef().genericize().equals(VACCINATION_PENTA1_REF)) {
			vaccines.visit(scenario);
		}

		if ([NEXT_CHILD_REF, NEXT_CHILD_NO_MOTHER_REF].includes(scenario.nextRef().genericize())) {
			scenario.next();
		} else if (!scenario.nextRef().genericize().equals(FINAL_FLAT_REF)) {
			expect.fail('Unexpected next ref ' + scenario.nextRef().toString(true, true) + ' at index');
		}
	});
};

function answerChild(
	scenario: Scenario,
	healthRecord: HealthRecord,
	dobOrAgeInMonths: LocalDate | number,
	vaccines: Vaccines,
	sex: Sex
): Consumer<number> {
	if (typeof dobOrAgeInMonths === 'number') {
		return answerChild_ageInMonths(scenario, healthRecord, dobOrAgeInMonths, vaccines, sex);
	}

	return answerChild_dob(scenario, healthRecord, dobOrAgeInMonths, vaccines, sex);
}

const buildChildrenWithLocalDates = (
	scenario: Scenario,
	ageInMonths: number,
	healthRecord: HealthRecord
): ReadonlyArray<Consumer<number>> => {
	const dob = TODAY.minusMonths(Number(ageInMonths));

	return [
		answerChild(scenario, healthRecord, dob, NO_VACCINES, FEMALE),
		answerChild(scenario, healthRecord, dob, DIPHTERIA_FIRST, MALE),
		answerChild(scenario, healthRecord, dob, DIPHTERIA, FEMALE),
		answerChild(scenario, healthRecord, dob, MEASLES, MALE),
		answerChild(scenario, healthRecord, dob, DIPHTERIA_FIRST_AND_MEASLES, FEMALE),
		answerChild(scenario, healthRecord, dob, DIPHTERIA_AND_MEASLES, MALE),
	];
};

const buildChildrenWithIntegers = (
	scenario: Scenario,
	ageInMonths: number,
	healthRecord: HealthRecord
): ReadonlyArray<Consumer<number>> => {
	return [
		answerChild(scenario, healthRecord, ageInMonths, NO_VACCINES, MALE),
		answerChild(scenario, healthRecord, ageInMonths, DIPHTERIA_FIRST, FEMALE),
		answerChild(scenario, healthRecord, ageInMonths, DIPHTERIA, MALE),
		answerChild(scenario, healthRecord, ageInMonths, MEASLES, FEMALE),
		answerChild(scenario, healthRecord, ageInMonths, DIPHTERIA_FIRST_AND_MEASLES, MALE),
		answerChild(scenario, healthRecord, ageInMonths, DIPHTERIA_AND_MEASLES, FEMALE),
	];
};

const buildHouseholdChildren = (
	scenario: Scenario,
	healthRecord: HealthRecord
): ReadonlyArray<ReadonlyArray<Consumer<number>>> => {
	return [
		buildChildrenWithLocalDates(scenario, 23, healthRecord),
		buildChildrenWithIntegers(scenario, 23, healthRecord),
		buildChildrenWithLocalDates(scenario, 6, healthRecord),
		buildChildrenWithIntegers(scenario, 6, healthRecord),
		buildChildrenWithLocalDates(scenario, 3, healthRecord),
		buildChildrenWithIntegers(scenario, 3, healthRecord),
	];
};

const answerHousehold = (
	scenario: Scenario,
	number: number,
	children: ReadonlyArray<Consumer<number>>
): void => {
	// region Answer info about the household

	scenario.trace('HOUSEHOLD ' + number);
	scenario.next();
	scenario.next();
	scenario.answer(number);
	// Does someone answer the door?
	scenario.next();
	scenario.answer('yes');
	// Is there an adult
	scenario.next();
	scenario.answer('yes');
	// Do children under 2 live in the house?
	scenario.next();
	scenario.answer('yes');
	// What's the mother's or caregiver's name
	scenario.next();
	scenario.answer('Foo');
	// Is the mother or caregiver present?
	scenario.next();
	scenario.answer('yes');
	// Give consent
	scenario.next();
	scenario.answer('yes');

	// endregion

	// How many children under 2?
	scenario.next();
	scenario.answer(children.length);

	children.forEach((child, i) => {
		child.accept(i);
	});

	scenario.trace('END CHILDREN');
};

describe('ChildVaccinationTest.java', () => {
	afterEach(() => {
		refSingletons.clear();
	});

	it.fails('[smoke test]', async () => {
		let scenario: Scenario | null = null;

		try {
			scenario = await Scenario.init('child_vaccination_VOL_tool_v12.xml');

			expect.fail('Update `child-vaccination.test.ts`, known failure mode has changed');
		} catch (error) {
			expect(error).toBeInstanceOf(Error);

			// Failure of this assertion likely means that we've implemented the
			// `indexed-repeat` XPath function. When that occurs, these error
			// condition assertions should be removed, and the `Scenario.init` call
			// should be treated normally.
			//
			// If a new failure occurs after that point, and that failure cannot be
			// addressed by updating the test to be more complete (e.g. by specifying
			// more of the expected references in `scenario.next` calls, or
			// implementing other aspects of the test which are currently deferred),
			// consider adding a similar function/assertion/comment to this effect,
			// asserting that new known failure condition and prompting the test to be
			// updated again once it is resolved.
			expect((error as Error).message).toContain('function not defined: indexed-repeat');
		}

		if (scenario == null) {
			return;
		}

		scenario.next('/data/building_type');

		const currentExpectedPointOfFailure = () => {
			scenario.answer('multi');
		};

		try {
			expect(currentExpectedPointOfFailure).toThrowError('function not defined: indexed-repeat');

			if (typeof currentExpectedPointOfFailure === 'function') {
				scenario.trace(
					'Early exit of child-vaccination.test.ts smoke test: known failure point has been reached'
				);

				return;
			}
		} catch {
			throw new Error();
		}

		scenario.answer('multi');
		scenario.next('/data/not_single');
		scenario.next('/data/not_single/gps');
		scenario.answer('1.234 5.678');
		scenario.next('/data/building_name');
		scenario.answer('Some building');
		scenario.next('/data/full_address1');
		scenario.answer('Some address, some location');

		// endregion

		// region Answer all household repeats

		// Create all possible permutations of children combining
		// all health record types, meaningful ages, ways to define age,
		// and vaccination sets, which amounts to 18 households and 108 children
		const households = HealthRecord.all().flatMap((healthRecord) =>
			buildHouseholdChildren(scenario, healthRecord)
		);

		households.forEach((children, i) => {
			// assertThat(scenario.nextRef().genericize(), is(NEW_HOUSEHOLD_REPEAT_JUNCTION_REF));
			expect(scenario.nextRef().genericize()).toEqual(NEW_HOUSEHOLD_REPEAT_JUNCTION_REF);

			answerHousehold(scenario, i, children);
			// We just want to make sure that we are in a valid position without
			// going into more detail. Due to the conditional nature of this
			// form, it would be too complex to describe that in a test with all
			// the precission in a test like this one that will follow all possible
			// branches.
			// assertThat(
			// 	scenario.refAtIndex().genericize(),
			// 	anyOf(
			// 		// Either we stopped after filling the age with a decomposed date
			// 		is(DOB_DAY_MONTH_TYPE_1_REF),
			// 		is(DOB_DAY_MONTH_TYPE_2_REF),
			// 		is(DOB_DAY_MONTH_TYPE_3_REF),
			// 		is(DOB_DAY_MONTH_TYPE_4_REF),
			// 		// Or we stopped after filling the age in months
			// 		is(DOB_AGE_IN_MONTHS_REF),
			// 		// Or we stopped after answering any of the vaccination questions
			// 		is(VACCINATION_PENTA1_REF),
			// 		is(VACCINATION_PENTA3_REF),
			// 		is(VACCINATION_MEASLES_REF),
			// 		// Or we answered all questions
			// 		is(NEXT_CHILD_REF)
			// 	)
			// );
			expect([
				// Either we stopped after filling the age with a decomposed date
				DOB_DAY_MONTH_TYPE_1_REF,
				DOB_DAY_MONTH_TYPE_2_REF,
				DOB_DAY_MONTH_TYPE_3_REF,
				DOB_DAY_MONTH_TYPE_4_REF,
				// Or we stopped after filling the age in months
				DOB_AGE_IN_MONTHS_REF,
				// Or we stopped after answering any of the vaccination questions
				VACCINATION_PENTA1_REF,
				VACCINATION_PENTA3_REF,
				VACCINATION_MEASLES_REF,
				// Or we answered all questions
				NEXT_CHILD_REF,
			]).toContainEqual(scenario.refAtIndex().genericize());

			scenario.next();

			// assertThat(scenario.refAtIndex().genericize(), is(FINAL_FLAT_REF));
			expect(scenario.refAtIndex().genericize()).toEqual(FINAL_FLAT_REF);

			if (i + 1 < households.length) {
				scenario.answer('no');
				scenario.next();
			} else {
				scenario.answer('yes');
			}
		});

		scenario.trace('END HOUSEHOLDS');

		// endregion

		// region Go to the end of the form

		scenario.next();

		// assertThat(scenario.refAtIndex().genericize(), is(FINISHED_FORM_REF));
		expect(scenario.refAtIndex().genericize()).toEqual(FINISHED_FORM_REF);

		scenario.next();

		// endregion
	});
});
