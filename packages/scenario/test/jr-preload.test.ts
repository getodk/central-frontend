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

describe('`jr:preload`', () => {
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
