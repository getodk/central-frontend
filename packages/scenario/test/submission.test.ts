import {
	bind,
	body,
	group,
	head,
	html,
	input,
	item,
	label,
	mainInstance,
	model,
	repeat,
	select1,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

describe('Form submission', () => {
	describe('XFormSerializingVisitorTest.java', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * JavaRosa provides this method on an `XFormSerializingVisitor` class. We
		 * add a proposed API equivalent on {@link Scenario}. (Direct ported code is
		 * preserved, commented out above the proposed API usage.)
		 */
		describe('`serializeInstance`', () => {
			it('preserves unicode characters', async () => {
				const formDef = html(
					head(
						title('Some form'),
						model(
							mainInstance(t('data id="some-form"', t('text'))),
							bind('/data/text').type('string')
						)
					),
					body(input('/data/text'))
				);

				const scenario = await Scenario.init('Some form', formDef);
				scenario.next('/data/text');
				scenario.answer('\uD83E\uDDDB');

				// XFormSerializingVisitor visitor = new XFormSerializingVisitor();
				// byte[] serializedInstance = visitor.serializeInstance(scenario.getFormDef().getMainInstance());
				// assertThat(new String(serializedInstance), containsString("<text>\uD83E\uDDDB</text>"));
				expect(scenario.proposed_serializeInstance()).toContain('<text>\uD83E\uDDDB</text>');
			});
		});
	});

	describe('instance serialization', () => {
		const DEFAULT_INSTANCE_ID = 'uuid:TODO-mock-xpath-functions';

		type TriggerValue = '' | 'OK';

		interface InstanceDefaultValues {
			readonly inp?: string;
			readonly sel1?: string;
			readonly selN?: string;
			readonly not?: string;
			readonly trig?: TriggerValue;
			readonly modelVal?: string;
		}

		it.each<InstanceDefaultValues>([
			{},
			{ inp: 'input default' },
			{ sel1: 'a' },
			{ sel1: 'b' },
			{ selN: 'one' },
			{ selN: 'one two' },
			{ not: 'note default' },
			{ trig: 'OK' },
			{ modelVal: 'modelVal default' },
			{
				inp: 'input default',
				sel1: 'b',
				selN: 'one two',
				not: 'note default',
				trig: 'OK',
				modelVal: 'modelVal default',
			},
		])('serializes default values %j', async (defaults) => {
			// prettier-ignore
			const scenario = await Scenario.init('XML serialization - basic, default values', html(
				head(
					title('XML serialization - basic, default values'),
					model(
						mainInstance(
							t('data id="xml-serialization-basic-default-values"',
								t('grp',
									t('inp', defaults.inp ?? ''),
									t('sel1', defaults.sel1 ?? ''),
									t('selN', defaults.selN ?? '')),
								t('not', defaults.not ?? ''),
								t('trig', defaults.trig ?? ''),
								t('subt',
									t('modelVal', defaults.modelVal ?? '')),
								t('calc'),
								t('meta',
									t('instanceID')))
						),
						bind('/data/grp/inp').type('string'),
						bind('/data/grp/sel1').type('string'),
						bind('/data/grp/selN').type('string'),
						bind('/data/not').type('string').readonly(),
						bind('/data/trig').type('string'),
						bind('/data/subt/modelVal').type('string'),
						bind('/data/calc').calculate('1 + 2'),
						bind('/data/meta/instanceID').calculate(`'${DEFAULT_INSTANCE_ID}'`)
					)
				),
				body(
					group('/data/grp',
						label('grp (group)'),
						input('/data/grp/inp',
							label('inp (group / input)')),
						select1('/data/grp/sel1',
							label('sel1 (group / select1)'),
							item('a', 'A'),
							item('b', 'B')
						),
						t('select ref="/data/grp/selN"',
							label('selN (group / select)'),
							item('one', 'One'),
							item('two', 'Two'))),
					input('/data/not',
						label('not (note)')),
					t('trigger ref="/data/trig"',
						label('trig (trigger)'))
				)
			));

			expect(scenario).toHaveSerializedSubmissionXML(
				// prettier-ignore
				t('data',
					t('grp',
						t('inp', defaults.inp ?? ''),
						t('sel1', defaults.sel1 ?? ''),
						t('selN', defaults.selN ?? '')),
					t('not', defaults.not ?? ''),
					t('trig', defaults.trig ?? ''),
					t('subt',
						t('modelVal', defaults.modelVal ?? '')),
					t('calc', '3'),
					t('meta',
						t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
			);
		});

		// The original ported JavaRosa test exercising Unicode support was a good
		// reminder that we have an outstanding issue to support Unicode
		// normalization in `@getodk/xpath` (i.e. consistent use of combined forms,
		// see https://github.com/getodk/web-forms/issues/175).
		describe('unicode', () => {
			const decomposed = 'é';
			const composed = 'é';

			const getUnicodeScenario = async (defaultValue = '') => {
				// prettier-ignore
				return Scenario.init('Unicode normalization', html(
					head(
						title('Unicode normalization'),
						model(
							mainInstance(
								t('data id="unicode-normalization"',
									t('rep',
										t('inp', defaultValue)),
										t('meta', t('instanceID')))
							),
							bind('/data/rep/inp'),
							bind('/data/meta/instanceID').calculate(`'${DEFAULT_INSTANCE_ID}'`)
						)
					),
					body(
						repeat('/data/rep',
							label('rep'),
							input('/data/rep/inp',
								label('inp'))))
				));
			};

			// Check setup assumptions
			beforeEach(() => {
				// 1. `decomposed` and `composed` are equivalent
				expect(decomposed.normalize()).toBe(composed);

				// 2. `decomposed` and `composed` are NOT equal
				expect(decomposed).not.toBe(composed);
			});

			it('normalizes combining characters in a default value to their composed form', async () => {
				const scenario = await getUnicodeScenario(decomposed);

				expect(scenario).toHaveSerializedSubmissionXML(
					// prettier-ignore
					t('data',
						t('rep',
							t('inp', composed)),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);
			});

			it('normalizes combining characters in an assigned value to their composed form', async () => {
				const scenario = await getUnicodeScenario();

				scenario.answer('/data/rep[1]/inp', decomposed);

				expect(scenario).toHaveSerializedSubmissionXML(
					// prettier-ignore
					t('data',
						t('rep',
							t('inp', composed)),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);
			});
		});

		describe('repeats', () => {
			let scenario: Scenario;

			beforeEach(async () => {
				// prettier-ignore
				scenario = await Scenario.init('XML serialization - repeats', html(
					head(
						title('XML serialization - repeats'),
						model(
							mainInstance(
								t('data id="xml-serialization-repeats"',
									t('rep jr:template=""',
										t('inp')),
										t('meta', t('instanceID')))
							),
							bind('/data/rep/inp').type('string'),
							bind('/data/meta/instanceID').calculate(`'${DEFAULT_INSTANCE_ID}'`)
						)
					),
					body(
						group('/data/rep',
							repeat('/data/rep',
								input('/data/rep/inp'))))
				));
			});

			it('does not serialize an element for a repeat range', () => {
				expect(scenario).toHaveSerializedSubmissionXML(
					// prettier-ignore
					t('data',
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);
			});

			it('serializes each repeat instance and its descendants', () => {
				scenario.createNewRepeat('/data/rep');
				scenario.answer('/data/rep[1]/inp', 'a');
				scenario.createNewRepeat('/data/rep');
				scenario.answer('/data/rep[2]/inp', 'b');

				expect(scenario).toHaveSerializedSubmissionXML(
					// prettier-ignore
					t('data',
						t('rep',
							t('inp', 'a')),
						t('rep',
							t('inp', 'b')),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);

				scenario.removeRepeat('/data/rep[1]');

				expect(scenario).toHaveSerializedSubmissionXML(
					// prettier-ignore
					t('data',
						t('rep',
							t('inp', 'b')),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);
			});
		});

		describe('relevance', () => {
			let scenario: Scenario;

			beforeEach(async () => {
				// prettier-ignore
				scenario = await Scenario.init('XML serialization - relevance', html(
					head(
						title('XML serialization - relevance'),
						model(
							mainInstance(
								t('data id="xml-serialization-relevance"',
									t('grp-rel', '1'),
									t('inp-rel', '1'),
									t('grp',
										t('inp', 'inp default value')),
										t('meta', t('instanceID')))
							),
							bind('/data/grp-rel'),
							bind('/data/inp-rel'),
							bind('/data/grp').relevant('/data/grp-rel = 1'),
							bind('/data/grp/inp').relevant('/data/inp-rel = 1'),
							bind('/data/meta/instanceID').calculate(`'${DEFAULT_INSTANCE_ID}'`)
						)
					),
					body(
						input('/data/grp-rel',
							label('`grp` is relevant when this value is 1')),
						input('/data/inp-rel',
							label('`inp` is relevant when this value is 1')),
						group('/data/grp',
							label('grp'),

							input('/data/grp/inp',
								label('inp'))))
				))
			});

			it('omits non-relevant leaf nodes', () => {
				scenario.answer('/data/inp-rel', '0');

				expect(scenario).toHaveSerializedSubmissionXML(
					// prettier-ignore
					t('data',
						t('grp-rel', '1'),
						t('inp-rel', '0'),
						t('grp'),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);
			});

			it('omits non-relevant subtree nodes', () => {
				scenario.answer('/data/grp-rel', '0');

				expect(scenario).toHaveSerializedSubmissionXML(
					// prettier-ignore
					t('data',
						t('grp-rel', '0'),
						t('inp-rel', '1'),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);
			});
		});
	});
});
