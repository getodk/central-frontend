import { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { AnyNode, RepeatInstanceNode } from '@getodk/xforms-engine';
import { afterEach, assert, describe, expect, it } from 'vitest';
import type { ValueNodeAnswer } from '../../src/answer/ValueNodeAnswer.ts';
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
 * Intentionally naive. The scope of expressions we expect to handle in this
 * test suite is narrow enough that we don't need to do more robust static
 * analysis and serialization. There is more complete logic in
 * `@getodk/xforms-engine` to do this, but it's intentionally project-private
 * (at least it is at time of writing).
 */
const naiveStripPositionalPredicates = (expression: string): string => {
	return expression.replaceAll(/\[\d+\]/g, '');
};

const refSingletons = new UpsertableMap<string, JRTreeReference>();

class JRTreeReference extends BaseJRTreeReference {
	genericize(): JRTreeReference {
		const reference = naiveStripPositionalPredicates(this.xpathReference);

		return new JRTreeReference(reference);
	}

	equals(other: JRTreeReference): boolean {
		return this.xpathReference === other.xpathReference;
	}

	override toString(): string {
		return this.xpathReference;
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

	private getNextEventPosition(): AnyPositionalEvent {
		const currentPosition = this.getSelectedPositionalEvent();

		if (currentPosition.eventType === 'END_OF_FORM') {
			throw 'todo';
		}

		const events = this.getPositionalEvents();
		const position = this.getEventPosition();
		const next = events[position + 1];

		if (next == null) {
			throw new Error(`No question at position: ${position}`);
		}

		return next;
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
		const next = this.getNextEventPosition();

		if (next.eventType === 'END_OF_FORM') {
			throw 'todo';
		}

		return new JRTreeReference(next.node.currentState.reference);
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

	private matchNextReference(possibleReferences: readonly string[]): string | null {
		const nextReference = this.nextRef().xpathReference;

		for (const possibleReference of possibleReferences) {
			if (possibleReference === nextReference) {
				return possibleReference;
			}
		}

		return null;
	}

	answerIfNext(optionalReference: string, answer: unknown): ValueNodeAnswer | null {
		const nextReference = this.matchNextReference([optionalReference]);

		if (nextReference != null) {
			this.next(nextReference);

			return this.answer(answer);
		}

		return null;
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

	visit(scenario: Scenario, childRepeatPath: string): void {
		const { value } = this;

		switch (value) {
			case HealthRecordValue.HEALTH_HANDBOOK:
				scenario.next(`${childRepeatPath}/health_card`);
				scenario.answer('yes');
				break;

			case HealthRecordValue.VACCINATION_CARD:
				scenario.next(`${childRepeatPath}/health_card`);
				scenario.answer('no');
				scenario.next(`${childRepeatPath}/ever_had_card`);
				scenario.answer('yes');
				break;

			case HealthRecordValue.HEALTH_CLINIC:
				scenario.next(`${childRepeatPath}/health_card`);
				scenario.answer('no');
				scenario.next(`${childRepeatPath}/ever_had_card`);
				scenario.answer('no');
				scenario.next(`${childRepeatPath}/ever_been_clinic`);
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

	visit(scenario: Scenario, childRepeatPath: string): void {
		const { diphteriaFirst, diphteriaThird, measles } = this;

		scenario.answerIfNext(`${childRepeatPath}/penta1`, diphteriaFirst ? 'yes' : 'no');
		scenario.answerIfNext(`${childRepeatPath}/penta3`, diphteriaThird ? 'yes' : 'no');
		scenario.answerIfNext(`${childRepeatPath}/mcv1`, measles ? 'yes' : 'no');
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

const answerAgeInMonths = (
	scenario: Scenario,
	childRepeatPath: string,
	ageInMonths: number
): void => {
	// Is DoB known?
	scenario.next(`${childRepeatPath}/dobknown`);
	scenario.answer('no');

	// Age in months
	scenario.next(`${childRepeatPath}/age_months`);
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

		const childRepeatPath = getChildRepeatPath(scenario, i);

		scenario.trace(name);
		scenario.next(childRepeatPath);
		scenario.next(`${childRepeatPath}/childName`);
		scenario.answer(name);
		healthRecord.visit(scenario, childRepeatPath);
		scenario.next(`${childRepeatPath}/sex`);
		scenario.answer(sex.getName());

		answerAgeInMonths(scenario, childRepeatPath, ageInMonths);

		if (scenario.nextRef().genericize().equals(VACCINATION_PENTA1_REF)) {
			vaccines.visit(scenario, childRepeatPath);
		}

		const nextRef = scenario.nextRef().genericize();

		if (nextRef.equals(NEXT_CHILD_REF)) {
			scenario.next(`${childRepeatPath}/nextChild`);
		} else if (nextRef.equals(NEXT_CHILD_NO_MOTHER_REF)) {
			scenario.next(`${childRepeatPath}/nextChild_no_mother`);
		} else if (!nextRef.equals(FINAL_FLAT_REF)) {
			expect.fail('Unexpected next ref ' + nextRef.toString() + ' at index');
		}
	});
};

const answerDateOfBirth = (scenario: Scenario, childRepeatPath: string, dob: LocalDate): void => {
	// Is DoB known?
	scenario.next(`${childRepeatPath}/dobknown`);
	scenario.answer('yes');

	// Year in DoB
	scenario.next(`${childRepeatPath}/dob_year`);
	scenario.answer(dob.year() /* .getYear() */);

	// Month in DoB
	scenario.next(`${childRepeatPath}/dob_month`);
	scenario.answer(dob.monthValue() /* .getMonthValue() */);

	let dobDayPath: string;

	// Reproduce relevance logic from form to determine DoB field
	switch (dob.monthValue()) {
		case 1:
		case 3:
		case 5:
		case 7:
		case 8:
		case 10:
		case 12:
			dobDayPath = `${childRepeatPath}/dob_day_1`;
			break;

		case 4:
		case 6:
		case 9:
		case 11:
			dobDayPath = `${childRepeatPath}/dob_day_2`;
			break;

		case 2: {
			const dobYear = dob.year();
			const leap = dobYear === 2016 || dobYear === 2020 || dobYear === 2024 || dobYear === 2028;

			if (leap) {
				dobDayPath = `${childRepeatPath}/dob_day_3`;
			} else {
				dobDayPath = `${childRepeatPath}/dob_day_4`;
			}

			break;
		}

		// This should not happen! But if it does, we've broken something in the
		// ported test logic as we've updated it.
		default: {
			dobDayPath = '/UNREACHABLE';
			expect(dob.monthValue()).toBeNaN();
		}
	}

	// Day in DoB
	scenario.next(dobDayPath);
	scenario.answer(dob.dayOfMonth() /* .getDayOfMonth() */);
};

const getChildRepeatPath = (scenario: Scenario, childIndex: number): string => {
	const currentQuestion = scenario.getQuestionAtIndex();

	let currentNode: AnyNode | null = currentQuestion.node;
	let currentHousehold: RepeatInstanceNode | null = null;

	while (currentHousehold == null) {
		currentNode = currentNode.parent;

		if (currentNode == null || currentNode.nodeType === 'root') {
			break;
		}

		if (
			currentNode.nodeType === 'repeat-instance' &&
			/^\/data\/household\[\d+\]$/.test(currentNode.currentState.reference)
		) {
			currentHousehold = currentNode;
		}
	}

	assert(currentHousehold != null);

	const currentHouseholdPath = currentHousehold.currentState.reference;

	expect(currentHouseholdPath).toMatch(/^\/data\/household\[\d+\]$/);

	const childRepeatPosition = childIndex + 1;

	return `${currentHouseholdPath}/child_repeat[${childRepeatPosition}]`;
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

		const childRepeatPath = getChildRepeatPath(scenario, i);

		scenario.trace(name);
		scenario.next(childRepeatPath);
		scenario.next(`${childRepeatPath}/childName`);
		scenario.answer(name);
		healthRecord.visit(scenario, childRepeatPath);
		scenario.next(`${childRepeatPath}/sex`);
		scenario.answer(sex.getName());

		answerDateOfBirth(scenario, childRepeatPath, dob);

		if (scenario.nextRef().genericize().equals(NOT_ELIG_NOTE_REF)) {
			scenario.next();
		} else if (scenario.nextRef().genericize().equals(VACCINATION_PENTA1_REF)) {
			vaccines.visit(scenario, childRepeatPath);
		}

		const nextRef = scenario.nextRef().genericize();

		if (nextRef.equals(NEXT_CHILD_REF)) {
			scenario.next(`${childRepeatPath}/nextChild`);
		} else if (nextRef.equals(NEXT_CHILD_NO_MOTHER_REF)) {
			scenario.next(`${childRepeatPath}/nextChild_no_mother`);
		} else if (!nextRef.equals(FINAL_FLAT_REF)) {
			expect.fail('Unexpected next ref ' + nextRef.toString() + ' at index');
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
	const householdRepeatPosition = number + 1;
	const householdRepeatPath = `/data/household[${householdRepeatPosition}]`;

	scenario.trace('HOUSEHOLD ' + number);
	scenario.next(householdRepeatPath);
	scenario.next(`${householdRepeatPath}/flatNumber`);
	scenario.answer(number);
	// Does someone answer the door?
	scenario.next(`${householdRepeatPath}/inHome`);
	scenario.answer('yes');
	// Is there an adult
	scenario.next(`${householdRepeatPath}/adultPresence`);
	scenario.answer('yes');
	// Do children under 2 live in the house?
	scenario.next(`${householdRepeatPath}/childPresent`);
	scenario.answer('yes');
	// What's the mother's or caregiver's name
	scenario.next(`${householdRepeatPath}/motherName`);
	scenario.answer('Foo');
	// Is the mother or caregiver present?
	scenario.next(`${householdRepeatPath}/motherPresent`);
	scenario.answer('yes');
	// Give consent
	scenario.next(`${householdRepeatPath}/consent`);
	scenario.answer('yes');

	// endregion

	// How many children under 2?
	scenario.next(`${householdRepeatPath}/childNum`);
	scenario.answer(children.length);

	children.forEach((child, i) => {
		child.accept(i);
	});

	scenario.trace('END CHILDREN');
};

class KnownFailureError extends Error {
	static from(cause: Error) {
		return new this(cause);
	}

	private constructor(override readonly cause: Error) {
		super('Known failure', { cause });
	}

	reportKnownFailure() {
		return this.cause.message;
	}
}

type KnownFailureTest = () => Promise<void>;

type KnownFailureTestAPI = (description: string, fn: KnownFailureTest) => void;

describe('ChildVaccinationTest.java', () => {
	afterEach(() => {
		refSingletons.clear();
	});

	// prettier-ignore
	type ChildVaccinationTestFixtureName =
		// eslint-disable-next-line @typescript-eslint/sort-type-constituents
		| 'child_vaccination_VOL_tool_v12.xml'
		| 'child_vaccination_VOL_tool_v12-alt.xml';

	interface FixtureCase {
		readonly fixtureName: ChildVaccinationTestFixtureName;

		/**
		 * @see {@link https://github.com/getodk/web-forms/issues/205}
		 */
		readonly failureMode: 'INFINITE_LOOP' | null;
	}

	describe.each<FixtureCase>([
		{
			fixtureName: 'child_vaccination_VOL_tool_v12.xml',
			failureMode: 'INFINITE_LOOP',
		},
		{
			fixtureName: 'child_vaccination_VOL_tool_v12-alt.xml',
			failureMode: null,
		},
	])('fixture: $fixtureName', ({ fixtureName, failureMode }) => {
		let testFn: KnownFailureTestAPI;

		if (failureMode != null) {
			testFn = (description, fn) => {
				return it(description, async () => {
					let unexpectedFailureMessage: string | null = null;

					try {
						await fn();

						expect.fail('Update `child-vaccination.test.ts`, test is passing!');
					} catch (error) {
						if (error instanceof KnownFailureError) {
							// eslint-disable-next-line no-console
							console.log(
								'Early exit of child-vaccination.test.ts smoke test: known failure point has been reached. Known failure:',
								error.reportKnownFailure()
							);

							return;
						}

						assert(error instanceof Error);
						unexpectedFailureMessage = error.message;
					}

					expect.fail(
						`Update \`child-vaccination.test.ts\`, known failure mode has changed: ${unexpectedFailureMessage}`
					);
				});
			};
		} else {
			testFn = it;
		}

		testFn('[smoke test]', async () => {
			const scenario = await Scenario.init(fixtureName);

			scenario.next('/data/building_type');

			const answerBuildTypeMulti = () => {
				scenario.answer('multi');
			};

			if (failureMode === 'INFINITE_LOOP') {
				try {
					answerBuildTypeMulti();

					throw new Error('Expected failure mode has changed');
				} catch (error) {
					if (error instanceof Error && error.message.toLowerCase().includes('infinite loop')) {
						throw KnownFailureError.from(error);
					}

					throw error;
				}
			} else {
				answerBuildTypeMulti();
			}

			scenario.next('/data/not_single');
			scenario.next('/data/not_single/gps');
			scenario.answer('1.234 5.678 0 2.3'); // an accuracy of 0m or greater than 5m makes a second geopoint question relevant
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

				const householdPosition = i + 1;
				const householdPath = `/data/household[${householdPosition}]`;

				scenario.next(`${householdPath}/finalflat`);

				// assertThat(scenario.refAtIndex().genericize(), is(FINAL_FLAT_REF));
				expect(scenario.refAtIndex().genericize()).toEqual(FINAL_FLAT_REF);

				if (i + 1 < households.length) {
					scenario.answer('no');
					scenario.next(`${householdPath}/finished2`);
				} else {
					scenario.answer('yes');
				}
			});

			scenario.trace('END HOUSEHOLDS');

			// endregion

			// region Go to the end of the form

			scenario.next(`/data/household[${households.length}]/finished2`);

			// assertThat(scenario.refAtIndex().genericize(), is(FINISHED_FORM_REF));
			expect(scenario.refAtIndex().genericize()).toEqual(FINISHED_FORM_REF);

			scenario.next('END_OF_FORM');

			// endregion
		});
	});
});
