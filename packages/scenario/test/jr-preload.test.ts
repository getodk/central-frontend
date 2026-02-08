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
import type { PreloadProperties } from '@getodk/xforms-engine';
import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

const CENTRAL_DATE_FORMAT_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const CENTRAL_DATETIME_FORMAT_REGEX =
	/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+[+|-][0-9]{2}:[0-9]{2}$/;

describe('`jr:preload`', () => {
	describe('uid', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/utils/test/QuestionPreloaderTest.java#L23
		it('preloads specified data in bound elements', async () => {
			const scenario = await Scenario.init(
				'Preload attribute',
				html(
					head(
						title('Preload element'),
						model(
							mainInstance(t('data id="preload-attribute"', t('element'))),
							bind('/data/element').preload('uid')
						)
					),
					body(input('/data/element'))
				)
			);

			expect(scenario.answerOf('/data/element')).toStartWith('uuid:');
		});

		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/utils/test/QuestionPreloaderTest.java#L43
		it('preloads specified data in bound attributes', async () => {
			const scenario = await Scenario.init(
				'Preload attribute',
				html(
					head(
						title('Preload attribute'),
						model(
							mainInstance(t('data id="preload-attribute"', t('element attr=""'))),
							bind('/data/element/@attr').preload('uid')
						)
					),
					body(input('/data/element'))
				)
			);

			expect(scenario.attributeOf('/data/element', 'attr')).toStartWith('uuid:');
		});
	});

	describe('datetime', () => {
		it('preloads timestamp start', async () => {
			const start = Temporal.Now.instant().epochNanoseconds;
			const scenario = await Scenario.init(
				'Preload start date',
				html(
					head(
						title('Preload start date'),
						model(
							mainInstance(t('data id="preload-attribute"', t('element'))),
							bind('/data/element').type('xsd:dateTime').preload('timestamp').preloadParams('start')
						)
					),
					body()
				)
			);
			const end = Temporal.Now.instant().epochNanoseconds;
			const val = scenario.answerOf('/data/element').toString();
			const actual = Temporal.Instant.from(val).epochNanoseconds;

			expect(actual).toBeGreaterThanOrEqual(start);
			expect(actual).toBeLessThanOrEqual(end);

			expect(val).toMatch(CENTRAL_DATETIME_FORMAT_REGEX);
		});

		it('preloads date today', async () => {
			const start = Temporal.Now.plainDateISO();
			const scenario = await Scenario.init(
				'Preload start date',
				html(
					head(
						title('Preload start date'),
						model(
							mainInstance(t('data id="preload-attribute"', t('element'))),
							bind('/data/element').type('xsd:date').preload('date').preloadParams('today')
						)
					),
					body()
				)
			);
			const end = Temporal.Now.plainDateISO();

			expect(scenario.answerOf('/data/element').toString()).toSatisfy((actual: string) => {
				const actualDate = Temporal.PlainDate.from(actual);
				expect(actual).toMatch(CENTRAL_DATE_FORMAT_REGEX);
				return actualDate.equals(start) || actualDate.equals(end); // just in case this test runs at midnight...
			});
		});

		it('preloads timestamp end', async () => {
			const scenario = await Scenario.init(
				'Preload end date',
				html(
					head(
						title('Preload end date'),
						model(
							mainInstance(t('data id="preload-attribute"', t('element'))),
							bind('/data/element').type('xsd:dateTime').preload('timestamp').preloadParams('end')
						)
					),
					body()
				)
			);
			expect(scenario.answerOf('/data/element').toString()).toEqual(''); // doesn't trigger until submission

			const start = Temporal.Now.instant().epochNanoseconds;
			await scenario.prepareWebFormsInstancePayload();
			const xml = scenario.proposed_serializeInstance();
			const end = Temporal.Now.instant().epochNanoseconds;
			const timestampElement = /<element>(.*)<\/element>/g.exec(xml);
			if (!timestampElement || timestampElement.length < 2 || !timestampElement[1]) {
				throw new Error('element not found');
			}

			const val = timestampElement[1];

			const actual = Temporal.Instant.from(val).epochNanoseconds;
			expect(actual).toBeGreaterThanOrEqual(start);
			expect(actual).toBeLessThanOrEqual(end);

			expect(val).toMatch(CENTRAL_DATETIME_FORMAT_REGEX);
		});
	});

	describe('editing', () => {
		it('does not update value when editing a property', async () => {
			const scenario = await Scenario.init(
				'Preload start date',
				html(
					head(
						title('Preload start date'),
						model(
							mainInstance(t('data id="preload-attribute"', t('element'))),
							bind('/data/element').type('xsd:dateTime').preload('timestamp').preloadParams('start')
						)
					),
					body()
				)
			);
			const originalValue = scenario.answerOf('/data/element').toString();

			const edited = await scenario.editCurrentInstance();
			expect(edited.answerOf('/data/element').toString()).to.equal(originalValue);
		});
	});

	describe('property', () => {
		const init = async (preloadProperties: PreloadProperties) => {
			return await Scenario.init(
				'Properties',
				html(
					head(
						title('Properties'),
						model(
							mainInstance(
								t(
									'data id="properties"',
									t('deviceid'),
									t('email'),
									t('username'),
									t('phonenumber')
								)
							),
							bind('/data/deviceid').type('string').preload('property').preloadParams('deviceid'),
							bind('/data/email').type('string').preload('property').preloadParams('email'),
							bind('/data/username').type('string').preload('property').preloadParams('username'),
							bind('/data/phonenumber')
								.type('string')
								.preload('property')
								.preloadParams('phonenumber')
						)
					),
					body()
				),
				{ preloadProperties }
			);
		};

		it('does nothing if not given properties', async () => {
			const scenario = await init({});
			expect(scenario.answerOf('/data/deviceid').toString()).to.equal('');
			expect(scenario.answerOf('/data/email').toString()).to.equal('');
			expect(scenario.answerOf('/data/username').toString()).to.equal('');
			expect(scenario.answerOf('/data/phonenumber').toString()).to.equal('');
		});

		it('bound from given properties', async () => {
			const scenario = await init({
				deviceID: '123456',
				email: 'my@email',
				username: 'mukesh',
				phoneNumber: '+15551234',
			});
			expect(scenario.answerOf('/data/deviceid').toString()).to.equal('123456');
			expect(scenario.answerOf('/data/email').toString()).to.equal('my@email');
			expect(scenario.answerOf('/data/username').toString()).to.equal('mukesh');
			expect(scenario.answerOf('/data/phonenumber').toString()).to.equal('+15551234');
		});
	});
});
