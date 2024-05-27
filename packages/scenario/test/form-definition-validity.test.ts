import type { BindBuilderXFormsElement } from '@getodk/common/test/fixtures/xform-dsl/BindBuilderXFormsElement.ts';
import type { XFormsElement } from '@getodk/common/test/fixtures/xform-dsl/XFormsElement.ts';
import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

/**
 * **PORTING NOTES**
 *
 * JavaRosa's error condition assertions have little in common with those we
 * have available in Vitest. Some liberties have been taken to preserve the
 * apparent semantic intent of tests checking for error conditions, with
 * JavaRosa's equivalents preserved but commented out where appropriate.
 */
describe('TriggerableDagTest.java', () => {
	describe('//region Cycles', () => {
		const buildFormForDagCyclesCheck = (
			initialValueOrFirstBind: BindBuilderXFormsElement | string | null,
			...rest: BindBuilderXFormsElement[]
		): XFormsElement => {
			let initialValue: string | null;
			let binds: readonly BindBuilderXFormsElement[];

			if (typeof initialValueOrFirstBind === 'string' || initialValueOrFirstBind == null) {
				initialValue = initialValueOrFirstBind;
				binds = rest;
			} else {
				initialValue = null;
				binds = [initialValueOrFirstBind, ...rest];
			}

			// Map the last part of each bind's nodeset to model fields
			// They will get an initial value if provided
			const modelFields = binds
				// eslint-disable-next-line @typescript-eslint/no-shadow
				.map((bind) => {
					const parts = bind.getNodeset().split('/');

					/**
					 * **PORTING NOTES**
					 *
					 * Slight deviation from JR for null safety
					 */
					const name = parts[parts.length - 1];
					if (name == null) {
						throw new Error(`Unexpected bind nodeset: ${bind.getNodeset()}`);
					}

					return name;
				})
				.map((name) => {
					if (initialValue == null) {
						return t(name);
					}

					return t(name, initialValue);
				});

			/**
			 * **PORTING NOTES**
			 *
			 * Java language oddity? JavaRosa uses `mainInstance = mainInstance(...)`?!
			 *
			 * TIL: Java allows calling an imported method name while also defining a
			 * local variable binding which shadows name of the method being called to
			 * define it! Maybe in review someone can satisfy my curiosity about
			 * whether that's a context-sensitive thing (Is it distinguished by call
			 * versus reference syntax? Does the binding not exist yet, and the name
			 * references only the binding after it occurs?), or some much more
			 * complex language grammar thing.
			 *
			 * In any case, we need another name for the local binding otherwise this
			 * would fail by attempting to call itself in its own definition.
			 */
			const mainInstance_ = mainInstance(t('data id="some-form"', ...modelFields));

			// Build the model including the main instance we've just built and the provided binds
			const modelChildren: readonly XFormsElement[] = [mainInstance_, ...binds];

			// Map each bind's nodeset to body fields (inputs)
			// eslint-disable-next-line @typescript-eslint/no-shadow
			const inputs = binds.map((bind) => bind.getNodeset()).map((name) => input(name));

			// Return the complete form including model fields, binds, and body inputs
			return html(head(title('Some form'), model(...modelChildren)), body(...inputs));
		};

		describe('parsing forms with cycles by self reference in calculate', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * We don't currently have explicit cycle detection. We did previously,
			 * but it was recently removed, as we were able to realize an earlier
			 * hypothetical goal to push more graph-specific logic into reactivity
			 * (which itself implements a DAG, albeit more generically).
			 *
			 * Porting this test faithfully, by checking the error message it
			 * produces, would suggest a greater behavioral divergence between
			 * JavaRosa and web forms than presently exists. As such, this current
			 * test is marked failing to demonstrate that.
			 *
			 * A supplementary test follows, which relaxes the error message check to
			 * demonstrate that loading the form _does fail as expected_.
			 *
			 * Note that while we don't yet intentionally implement error messaging
			 * for this scenario, it will certainly be a case we want to message
			 * clearly. It'll be interesting to think about how we might achieve that…
			 * even if it means reintroducing upfront cycle detection, which would
			 * ultimately be redundant beyond the error messaging use case.
			 */
			it.fails('should fail', async () => {
				// exceptionRule.expect(XFormParseException.class);
				// exceptionRule.expectMessage("Cycle detected in form's relevant and calculation logic!");

				const init = async () => {
					return Scenario.init(
						'Some form',
						buildFormForDagCyclesCheck(bind('/data/count').type('int').calculate('. + 1'))
					);
				};

				await expect(init).rejects.toThrow(
					"Cycle detected in form's relevant and calculation logic!"
				);
			});

			/**
			 * **PORTING NOTES**
			 *
			 * This test is supplementary to the one more faithfully ported from
			 * JavaRosa above (and that test's porting notes explain the reasoning for
			 * this in detail).
			 *
			 * Specific details of this test:
			 *
			 * 1. It seemed redundant to preserve (commented out) JavaRosa's different
			 *    approach to error condition assertions. But if we decide that those
			 *    commented out lines may be valuable for future maintenance (i.e. as
			 *    an aid to synchronization with JavaRosa), and if we also decide that
			 *    this supplemental test is suitable to stand in for the more faithful
			 *    port, we may want to move those lines into this test before removing
			 *    the other.
			 *
			 * 2. A first pass had included a check for the actual error message
			 *    that's currently produced. The thinking was that, since the error is
			 *    currently expected but doesn't express the specific intent, we could
			 *    at least have some additional intent **here** by making the test a
			 *    bit more brittle (as a reminder that the user-facing intent is
			 *    unaddressed). Unfortunately, each of our supported test environments
			 *    currently produces a different error message. So for now, we just
			 *    check that an error is produced at all.
			 */
			it('should fail (supplementary/alternate test with bogus error message check)', async () => {
				const init = async () => {
					return Scenario.init(
						'Some form',
						buildFormForDagCyclesCheck(bind('/data/count').type('int').calculate('. + 1'))
					);
				};

				await expect(init).rejects.toThrow();
			});
		});
	});
});
