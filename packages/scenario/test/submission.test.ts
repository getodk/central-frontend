import {
	OPENROSA_XFORMS_NAMESPACE_URI,
	OPENROSA_XFORMS_PREFIX,
	XFORMS_NAMESPACE_URI,
} from '@getodk/common/constants/xmlns.ts';
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
import { TagXFormsElement } from '@getodk/common/test/fixtures/xform-dsl/TagXFormsElement.ts';
import type { XFormsElement } from '@getodk/common/test/fixtures/xform-dsl/XFormsElement.ts';
import { createUniqueId } from 'solid-js';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';
import { ANSWER_OK, ANSWER_REQUIRED_BUT_EMPTY } from '../src/jr/validation/ValidateOutcome.ts';
import { ReactiveScenario } from '../src/reactive/ReactiveScenario.ts';

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
				t(`data id="xml-serialization-basic-default-values"`,
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

		describe('instance root attributes', () => {
			it('serializes attributes from the instance root, as they appear in the form definition', async () => {
				const formId = 'inst-root-attrs';
				const version = '2018061801';

				const scenario = await Scenario.init(
					'XML serialization - instance root attrs',
					// prettier-ignore
					html(
						head(
							title('XML serialization - instance root attrs'),
							model(
								mainInstance(
									t(`data id="${formId}" version="${version}"`,
										t('inp', 'val'),
										t('meta',
											t('instanceID')))
								),
								bind('/data/inp').type('string'),
								bind('/data/meta/instanceID').calculate(`'${DEFAULT_INSTANCE_ID}'`)
							)
						),
						body(
							input('/data/inp', label('Input (with default value)'))
						)
					)
				);

				expect(scenario).toHaveSerializedSubmissionXML(
					// prettier-ignore
					t(`data id="${formId}" version="${version}"`,
						t('inp', 'val'),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);
			});

			it('preserves instance root attribute namespace prefixes, as they appear in the form definition', async () => {
				const formId = 'inst-root-attrs';
				const version = '2018061801';

				const scenario = await Scenario.init(
					'XML serialization - instance root attrs',
					// prettier-ignore
					html(
						head(
							title('XML serialization - instance root attrs'),
							model(
								mainInstance(
									t(`data id="${formId}" orx:version="${version}"`,
										t('inp', 'val'),
										t('meta',
											t('instanceID')))
								),
								bind('/data/inp').type('string'),
								bind('/data/meta/instanceID').calculate(`'${DEFAULT_INSTANCE_ID}'`)
							)
						),
						body(
							input('/data/inp', label('Input (with default value)'))
						)
					)
				);

				expect(scenario).toHaveSerializedSubmissionXML(
					// prettier-ignore
					t(`data xmlns:orx="${OPENROSA_XFORMS_NAMESPACE_URI}" id="${formId}" orx:version="${version}"`,
						t('inp', 'val'),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);
			});

			it('preserves escaped values of instance root attributes', async () => {
				const formId = 'inst-root-attrs';
				const version = '2018061801&gt;&quot;XML&quot;&amp;special&lt;chars';

				const scenario = await Scenario.init(
					'XML serialization - instance root attrs',
					// prettier-ignore
					html(
						head(
							title('XML serialization - instance root attrs'),
							model(
								mainInstance(
									t(`data id="${formId}" orx:version="${version}"`,
										t('inp', 'val'),
										t('meta',
											t('instanceID')))
								),
								bind('/data/inp').type('string'),
								bind('/data/meta/instanceID').calculate(`'${DEFAULT_INSTANCE_ID}'`)
							)
						),
						body(
							input('/data/inp', label('Input (with default value)'))
						)
					)
				);

				expect(scenario).toHaveSerializedSubmissionXML(
					// prettier-ignore
					t(`data xmlns:orx="${OPENROSA_XFORMS_NAMESPACE_URI}" id="${formId}" orx:version="${version}"`,
						t('inp', 'val'),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);
			});
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
					t(`data id="unicode-normalization"`,
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
					t(`data id="unicode-normalization"`,
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
					t(`data id="xml-serialization-repeats"`,
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
					t(`data id="xml-serialization-repeats"`,
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
					t(`data id="xml-serialization-repeats"`,
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
					t(`data id="xml-serialization-relevance"`,
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
					t(`data id="xml-serialization-relevance"`,
						t('grp-rel', '0'),
						t('inp-rel', '1'),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);
			});
		});

		describe('client reactivity', () => {
			let scenario: ReactiveScenario;

			beforeEach(async () => {
				scenario = await ReactiveScenario.init(
					'XML serialization - client reactivity',
					// prettier-ignore
					html(
						head(
							title('Reactive XML serialization'),
							model(
								mainInstance(
									t('data id="reactive-xml-serialization"',
										t('rep-inp-rel'),
										t('rep',
											t('inp')),
											t('meta', t('instanceID')))
								),
								bind('/data/rep-inp-rel'),
								bind('/data/rep/inp').relevant("/data/rep-inp-rel = '' or /data/rep-inp-rel = position(..)"),
								bind('/data/meta/instanceID').calculate(`'${DEFAULT_INSTANCE_ID}'`)
							)
						),
						body(
							input('/data/rep-inp-rel',
								label('Each /data/rep/inp is relevant when this value is 1')),
							repeat('/data/rep',
								label('rep'),
								input('/data/rep/inp',
									label('inp'))))
					)
				);
			});

			it('updates XML serialization state on change to string node', () => {
				let serialized: string | null = null;

				scenario.createEffect(() => {
					serialized = scenario.proposed_serializeInstance();
				});

				// Default serialization before any state change
				expect(serialized).toBe(
					// prettier-ignore
					t(`data id="reactive-xml-serialization"`,
						t('rep-inp-rel'),
						t('rep',
							t('inp')),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);

				// Check reactive update for repeated changes
				for (let i = 0; i < 10; i += 1) {
					scenario.answer('/data/rep[1]/inp', `${i}`);

					// After first value change
					expect(serialized).toBe(
						// prettier-ignore
						t(`data id="reactive-xml-serialization"`,
							t('rep-inp-rel'),
							t('rep',
								t('inp', `${i}`)),
							t('meta',
								t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
					);
				}
			});

			it('updates XML serialization state when adding and removing repeat instances', () => {
				let serialized: string | null = null;

				scenario.createEffect(() => {
					serialized = scenario.proposed_serializeInstance();
				});

				// Default serialization before any state change
				expect(serialized).toBe(
					// prettier-ignore
					t(`data id="reactive-xml-serialization"`,
						t('rep-inp-rel'),
						t('rep',
							t('inp')),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);

				scenario.createNewRepeat('/data/rep');

				// First repeat instance added
				expect(serialized).toBe(
					// prettier-ignore
					t(`data id="reactive-xml-serialization"`,
						t('rep-inp-rel'),
						t('rep',
							t('inp')),
						t('rep',
							t('inp')),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);

				scenario.createNewRepeat('/data/rep');

				// Second repeat instance added
				expect(serialized).toBe(
					// prettier-ignore
					t(`data id="reactive-xml-serialization"`,
						t('rep-inp-rel'),
						t('rep',
							t('inp')),
						t('rep',
							t('inp')),
						t('rep',
							t('inp')),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);

				scenario.answer('/data/rep[1]/inp', 'rep 1 inp');
				scenario.answer('/data/rep[2]/inp', 'rep 2 inp');
				scenario.answer('/data/rep[3]/inp', 'rep 3 inp');

				// Each of the above values set
				expect(serialized).toBe(
					// prettier-ignore
					t(`data id="reactive-xml-serialization"`,
						t('rep-inp-rel'),
						t('rep',
							t('inp', 'rep 1 inp')),
						t('rep',
							t('inp', 'rep 2 inp')),
						t('rep',
							t('inp', 'rep 3 inp')),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);

				scenario.removeRepeat('/data/rep[3]');

				// Last repeat instance removed
				expect(serialized).toBe(
					// prettier-ignore
					t(`data id="reactive-xml-serialization"`,
						t('rep-inp-rel'),
						t('rep',
							t('inp', 'rep 1 inp')),
						t('rep',
							t('inp', 'rep 2 inp')),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);

				scenario.removeRepeat('/data/rep[1]');

				// First repeat instance removed
				expect(serialized).toBe(
					// prettier-ignore
					t(`data id="reactive-xml-serialization"`,
						t('rep-inp-rel'),
						t('rep',
							t('inp', 'rep 2 inp')),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);

				scenario.removeRepeat('/data/rep[1]');

				// All repeat instances removed
				expect(serialized).toBe(
					// prettier-ignore
					t(`data id="reactive-xml-serialization"`,
						t('rep-inp-rel'),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);
			});

			it('updates XML serialization state when relevance changes', () => {
				let serialized: string | null = null;

				scenario.createEffect(() => {
					serialized = scenario.proposed_serializeInstance();
				});

				scenario.createNewRepeat('/data/rep');
				scenario.createNewRepeat('/data/rep');
				scenario.answer('/data/rep[1]/inp', 'rep 1 inp');
				scenario.answer('/data/rep[2]/inp', 'rep 2 inp');
				scenario.answer('/data/rep[3]/inp', 'rep 3 inp');

				// Current serialization before any relevance change
				expect(serialized).toBe(
					// prettier-ignore
					t(`data id="reactive-xml-serialization"`,
						t('rep-inp-rel'),
						t('rep',
							t('inp', 'rep 1 inp')),
						t('rep',
							t('inp', 'rep 2 inp')),
						t('rep',
							t('inp', 'rep 3 inp')),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);

				scenario.answer('/data/rep-inp-rel', '1');

				// Non-relevant /data/rep[position() != '1']/inp omitted
				expect(serialized).toBe(
					// prettier-ignore
					t(`data id="reactive-xml-serialization"`,
						t('rep-inp-rel', '1'),
						t('rep',
							t('inp', 'rep 1 inp')),
						t('rep'),
						t('rep'),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);

				scenario.answer('/data/rep-inp-rel', '3');

				// Non-relevant /data/rep[position() != '3']/inp omitted
				expect(serialized).toBe(
					// prettier-ignore
					t(`data id="reactive-xml-serialization"`,
						t('rep-inp-rel', '3'),
						t('rep'),
						t('rep'),
						t('rep',
							t('inp', 'rep 3 inp')),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))).asXml()
				);
			});
		});
	});

	describe('submission payload', () => {
		const DEFAULT_INSTANCE_ID = 'uuid:TODO-mock-xpath-functions';

		// prettier-ignore
		type SubmissionFixtureElements =
			| readonly []
			| readonly [XFormsElement];

		interface BuildSubmissionPayloadScenario {
			readonly submissionElements?: SubmissionFixtureElements;
		}

		const buildSubmissionPayloadScenario = async (
			options?: BuildSubmissionPayloadScenario
		): Promise<Scenario> => {
			const scenario = await Scenario.init(
				'Prepare for submission',
				html(
					head(
						title('Prepare for submission'),
						model(
							mainInstance(
								t(
									'data id="prepare-for-submission"',
									t('rep', t('inp')),
									t('meta', t('instanceID'))
								)
							),
							...(options?.submissionElements ?? []),
							bind('/data/rep/inp').required(),
							bind('/data/meta/instanceID').calculate(`'${DEFAULT_INSTANCE_ID}'`)
						)
					),
					body(repeat('/data/rep', label('rep'), input('/data/rep/inp', label('inp'))))
				)
			);

			return scenario;
		};

		describe('submission definition', () => {
			it('includes a default submission definition', async () => {
				const scenario = await buildSubmissionPayloadScenario();
				const submissionResult = await scenario.prepareWebFormsSubmission();

				expect(submissionResult.definition).toMatchObject({
					submissionAction: null,
					submissionMethod: 'post',
					encryptionKey: null,
				});
			});

			it('includes a form-specified submission definition URL', async () => {
				const submissionAction = 'https://example.org';
				const scenario = await buildSubmissionPayloadScenario({
					submissionElements: [t(`submission action="${submissionAction}"`)],
				});
				const submissionResult = await scenario.prepareWebFormsSubmission();

				expect(submissionResult.definition).toMatchObject({
					submissionAction: new URL(submissionAction),
				});
			});

			it('accepts an explicit method="post" as post', async () => {
				const scenario = await buildSubmissionPayloadScenario({
					submissionElements: [t('submission method="post"')],
				});
				const submissionResult = await scenario.prepareWebFormsSubmission();

				expect(submissionResult.definition).toMatchObject({
					submissionMethod: 'post',
				});
			});

			it('treats method="form-data-post" as method="post"', async () => {
				const scenario = await buildSubmissionPayloadScenario({
					submissionElements: [t('submission method="form-data-post"')],
				});
				const submissionResult = await scenario.prepareWebFormsSubmission();

				expect(submissionResult.definition).toMatchObject({
					submissionMethod: 'post',
				});
			});

			it.each(['nope', 'not-this-either', 'poast'])(
				'fails to load when form specifies unsupported submission method',
				async (otherMethod) => {
					const init = async () => {
						await buildSubmissionPayloadScenario({
							submissionElements: [t(`submission method="${otherMethod}"`)],
						});
					};

					await expect(init).rejects.toThrow();
				}
			);

			it('includes a form-specified `base64RsaPublicKey` as encryptionKey', async () => {
				const base64RsaPublicKey = btoa(createUniqueId());
				const scenario = await buildSubmissionPayloadScenario({
					submissionElements: [
						// Note: `t()` fails here, presumably because the ported JavaRosa
						// `parseAttributes` doesn't expect equals signs as produced in
						// the trailing base64 value.
						new TagXFormsElement(
							'submission',
							new Map([['base64RsaPublicKey', base64RsaPublicKey]]),
							[]
						),
					],
				});
				const submissionResult = await scenario.prepareWebFormsSubmission();

				expect(submissionResult.definition).toMatchObject({
					encryptionKey: base64RsaPublicKey,
				});
			});
		});

		describe('for a single (monolithic) request', () => {
			describe('valid submission state', () => {
				let scenario: Scenario;
				let validSubmissionXML: string;

				beforeEach(async () => {
					scenario = await buildSubmissionPayloadScenario();

					scenario.answer('/data/rep[1]/inp', 'rep 1 inp');
					scenario.createNewRepeat('/data/rep');
					scenario.answer('/data/rep[2]/inp', 'rep 2 inp');

					// Check assumption: form state is valid
					expect(scenario.getValidationOutcome().outcome).toBe(ANSWER_OK);

					// prettier-ignore
					validSubmissionXML = t(`data id="prepare-for-submission"`,
						t('rep',
							t('inp', 'rep 1 inp')),
						t('rep',
							t('inp', 'rep 2 inp')),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))
					).asXml();
				});

				it('is ready for submission when instance state is valid', async () => {
					const submissionResult = await scenario.prepareWebFormsSubmission();

					expect(submissionResult).toBeReadyForSubmission();
				});

				it('includes submission instance XML file data', async () => {
					const submissionResult = await scenario.prepareWebFormsSubmission();

					await expect(submissionResult).toHavePreparedSubmissionXML(validSubmissionXML);
				});
			});

			describe('invalid submission state', () => {
				let scenario: Scenario;
				let invalidSubmissionXML: string;

				beforeEach(async () => {
					scenario = await buildSubmissionPayloadScenario();

					scenario.answer('/data/rep[1]/inp', 'rep 1 inp');
					scenario.createNewRepeat('/data/rep');

					// Check assumption: form state is valid
					expect(scenario.getValidationOutcome().outcome).toBe(ANSWER_REQUIRED_BUT_EMPTY);

					// prettier-ignore
					invalidSubmissionXML = t(`data id="prepare-for-submission"`,
						t('rep',
							t('inp', 'rep 1 inp')),
						t('rep',
							t('inp')),
						t('meta',
							t('instanceID', DEFAULT_INSTANCE_ID))
					).asXml();
				});

				it('is pending submission with violations', async () => {
					const submissionResult = await scenario.prepareWebFormsSubmission();

					expect(submissionResult).toBePendingSubmissionWithViolations();
				});

				it('produces submission instance XML file data even when current instance state is invalid', async () => {
					const submissionResult = await scenario.prepareWebFormsSubmission();

					await expect(submissionResult).toHavePreparedSubmissionXML(invalidSubmissionXML);
				});
			});
		});

		describe.todo('for multiple requests, chunked by maximum size');
	});

	describe('submission-specific metadata', () => {
		type MetadataElementName = 'instanceID';

		type MetaNamespaceURI = OPENROSA_XFORMS_NAMESPACE_URI | XFORMS_NAMESPACE_URI;

		type MetadataValueAssertion = (value: string | null) => unknown;

		const getMetaChildElement = (
			parent: ParentNode | null,
			namespaceURI: MetaNamespaceURI,
			localName: string
		): Element | null => {
			if (parent == null) {
				return null;
			}

			for (const child of parent.children) {
				if (child.namespaceURI === namespaceURI && child.localName === localName) {
					return child;
				}
			}

			return null;
		};

		/**
		 * Normally this might be implemented as a
		 * {@link https://vitest.dev/guide/extending-matchers | custom "matcher" (assertion)}.
		 * But it's so specific to this sub-suite that it would be silly to sprawl
		 * it out into other parts of the codebase!
		 */
		const assertMetadata = (
			scenario: Scenario,
			metaNamespaceURI: MetaNamespaceURI,
			name: MetadataElementName,
			assertion: MetadataValueAssertion
		): void => {
			const serializedInstanceBody = scenario.proposed_serializeInstance();
			/**
			 * Important: we intentionally omit the default namespace when serializing instance XML. We need to restore it here to reliably traverse nodes when {@link metaNamespaceURI} is {@link XFORMS_NAMESPACE_URI}.
			 */
			const instanceXML = `<instance xmlns="${XFORMS_NAMESPACE_URI}">${serializedInstanceBody}</instance>`;

			const parser = new DOMParser();
			const instanceDocument = parser.parseFromString(instanceXML, 'text/xml');
			const instanceElement = instanceDocument.documentElement;
			const instanceRoot = instanceElement.firstElementChild;

			assert(
				instanceRoot != null,
				`Failed to find instance root element.\n\nActual serialized XML: ${serializedInstanceBody}\n\nActual instance DOM state: ${instanceElement.outerHTML}`
			);

			const meta = getMetaChildElement(instanceRoot, metaNamespaceURI, 'meta');
			const targetElement = getMetaChildElement(meta, metaNamespaceURI, name);
			const value = targetElement?.textContent ?? null;

			assertion(value);
		};

		const PRELOAD_UID_PATTERN =
			/^uuid:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

		const assertPreloadUIDValue = (value: string | null) => {
			assert(value != null, 'Expected preload uid value to be serialized');
			expect(value, 'Expected preload uid value to match pattern').toMatch(PRELOAD_UID_PATTERN);
		};

		describe('instanceID', () => {
			describe('preload="uid"', () => {
				let scenario: Scenario;

				beforeEach(async () => {
					// prettier-ignore
					scenario = await Scenario.init('Meta instanceID preload uid', html(
						head(
							title('Meta instanceID preload uid'),
							model(
								mainInstance(
									t('data id="meta-instanceid-preload-uid"',
										t('inp', 'inp default value'),
										/** @see note on `namespaces` sub-suite! */
										t('meta',
											t('instanceID')))
								),
								bind('/data/inp').type('string'),
								bind('/data/meta/instanceID').preload('uid')
							)
						),
						body(
							input('/data/inp',
								label('inp')))
					));
				});

				/**
				 * @see {@link https://getodk.github.io/xforms-spec/#preload-attributes:~:text=concatenation%20of%20%E2%80%98uuid%3A%E2%80%99%20and%20uuid()}
				 */
				it('is populated with a concatenation of ‘uuid:’ and uuid()', () => {
					assertMetadata(
						scenario,
						/** @see note on `namespaces` sub-suite! */
						XFORMS_NAMESPACE_URI,
						'instanceID',
						assertPreloadUIDValue
					);
				});

				it('does not change after an input value is changed', () => {
					scenario.answer('/data/inp', 'any non-default value!');

					assertMetadata(
						scenario,
						/** @see note on `namespaces` sub-suite! */
						XFORMS_NAMESPACE_URI,
						'instanceID',
						assertPreloadUIDValue
					);
				});
			});

			/**
			 * NOTE: Do not read too much intent into this sub-suite coming after
			 * tests above with `meta` and `instanceID` in the default (XForms)
			 * namespace! Those tests were added first because they'll require the
			 * least work to make pass. The `orx` namespace _is preferred_, {@link
			 * https://getodk.github.io/xforms-spec/#metadata | per spec}.
			 *
			 * This fact is further emphasized by the next sub-suite, exercising
			 * default behavior when a `meta` subtree node (of either namespace) is
			 * not present.
			 */
			describe('namespaces', () => {
				it(`preserves the ${OPENROSA_XFORMS_PREFIX} (${OPENROSA_XFORMS_NAMESPACE_URI}) namespace when used in the form definition`, async () => {
					// prettier-ignore
					const scenario = await Scenario.init(
						'ORX Meta ORX instanceID preload uid',
						html(
							head(
								title('ORX Meta ORX instanceID preload uid'),
								model(
									mainInstance(
										t('data id="orx-meta-instanceid-preload-uid"',
											t('inp', 'inp default value'),
											t('orx:meta',
												t('orx:instanceID'))
										)
									),
									bind('/data/inp').type('string'),
									bind('/data/orx:meta/orx:instanceID').preload('uid')
								)
							),
							body(
								input('/data/inp',
									label('inp')))
					));

					assertMetadata(
						scenario,
						OPENROSA_XFORMS_NAMESPACE_URI,
						'instanceID',
						assertPreloadUIDValue
					);
				});

				// This is redundant to other tests already exercising unprefixed names!
				it.skip('preserves the default/un-prefixed namespace when used in the form definition');
			});

			describe('defaults when absent in form definition', () => {
				interface MissingInstanceIDLeafNodeCase {
					readonly metaNamespaceURI: MetaNamespaceURI;
				}

				describe.each<MissingInstanceIDLeafNodeCase>([
					{ metaNamespaceURI: OPENROSA_XFORMS_NAMESPACE_URI },
					{ metaNamespaceURI: XFORMS_NAMESPACE_URI },
				])('meta namespace URI: $metaNamespaceURI', ({ metaNamespaceURI }) => {
					const expectedNamePrefix =
						metaNamespaceURI === OPENROSA_XFORMS_NAMESPACE_URI ? 'orx:' : '';
					const metaSubtreeName = `${expectedNamePrefix}meta`;
					const instanceIDName = `${expectedNamePrefix}instanceID`;

					it(`injects and populates a missing ${instanceIDName} leaf node in an existing ${metaSubtreeName} subtree`, async () => {
						// prettier-ignore
						const scenario = await Scenario.init(
							'ORX Meta ORX instanceID preload uid',
							html(
								head(
									title('ORX Meta ORX instanceID preload uid'),
									model(
										mainInstance(
											t('data id="orx-meta-instanceid-preload-uid"',
												t('inp', 'inp default value'),
												t(metaSubtreeName)
											)
										),
										bind('/data/inp').type('string')
									)
								),
								body(
									input('/data/inp',
										label('inp')))
						));

						assertMetadata(scenario, metaNamespaceURI, 'instanceID', assertPreloadUIDValue);
					});
				});

				it('injects and populates an orx:meta subtree AND orx:instanceID leaf node', async () => {
					// prettier-ignore
					const scenario = await Scenario.init(
						'ORX Meta ORX instanceID preload uid',
						html(
							head(
								title('ORX Meta ORX instanceID preload uid'),
								model(
									mainInstance(
										t('data id="orx-meta-instanceid-preload-uid"',
											t('inp', 'inp default value')
										)
									),
									bind('/data/inp').type('string')
								)
							),
							body(
								input('/data/inp',
									label('inp')))
					));

					assertMetadata(
						scenario,
						OPENROSA_XFORMS_NAMESPACE_URI,
						'instanceID',
						assertPreloadUIDValue
					);
				});
			});
		});
	});
});
