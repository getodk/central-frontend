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
import type { FormLanguage, RootNode } from '@getodk/xforms-engine';
import { initializeForm } from '@getodk/xforms-engine';
import { createMutable } from 'solid-js/store';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../src/App.tsx';

describe('XFormView', () => {
	let rootElement: Element;
	let dispose: VoidFunction | null;

	const xform = html(
		head(
			title('Itext (basic)'),
			model(
				// prettier-ignore
				t('itext',
					t('translation lang="English"',
						t('text id="q1:label"',
							t('value', '1. Question one')
						)
					),
					t('translation lang="Español"',
						t('text id="q1:label"',
							t('value', '1. Pregunta uno')
						)
					)
				),
				mainInstance(t('root id="itext-basic"', t('q1'), t('meta', t('instanceID')))),
				bind('/root/q1')
			)
		),
		body(input('/root/q1', t(`label ref="jr:itext('q1:label')"`)))
	);

	let root: RootNode;

	beforeEach(async () => {
		root = await initializeForm(xform.asXml(), {
			config: {
				stateFactory: createMutable,
			},
		});
		rootElement = document.createElement('div');
		dispose = null;
	});

	afterEach(() => {
		dispose?.();
	});

	it('renders a label in the default language', () => {
		dispose = render(() => {
			return <App root={root} />;
		}, rootElement);

		const label = Array.from(rootElement.querySelectorAll('label')).find((element) => {
			return element.textContent?.startsWith('1.');
		});

		expect(label).not.toBeUndefined();
		expect(label!.textContent).toBe('1. Question one');
	});

	it('translates the label to another language', () => {
		dispose = render(() => {
			return <App root={root} />;
		}, rootElement);

		// TODO: the intent was actually to test this by selecting the menu item,
		// but resolving the menu item proved difficult. Probably better as an
		// e2e test?
		const spanishLanguage = root.languages.find(
			(activeLanguage): activeLanguage is FormLanguage => {
				return activeLanguage.language === 'Español';
			}
		);

		if (spanishLanguage == null) {
			expect.fail('Could not find Spanish form language');
		}

		root.setLanguage(spanishLanguage);

		const label = Array.from(rootElement.querySelectorAll('label')).find((element) => {
			return element.textContent?.startsWith('1.');
		});

		expect(label).not.toBeUndefined();
		expect(label!.textContent).toBe('1. Pregunta uno');
	});
});
