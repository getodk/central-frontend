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
});
