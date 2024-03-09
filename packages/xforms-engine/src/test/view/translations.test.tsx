import { render } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../App.tsx';
import { XFormDefinition } from '../../lib/xform/XFormDefinition.ts';
import { EntryState } from '../../lib/xform/state/EntryState.ts';
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
} from '../../test/fixtures/xform-dsl/index.ts';

describe('XFormView', () => {
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

	let xformDefinition: XFormDefinition;

	beforeEach(() => {
		xformDefinition = new XFormDefinition(xform.asXml());
	});

	it('renders a label in the default language', () => {
		const rendered = render(() => {
			const entry = new EntryState(xformDefinition);

			return <App entry={entry} />;
		});

		const label = rendered.getByText(/^1\./);

		expect(label).toBeInTheDocument();
		expect(label.textContent).toBe('1. Question one');
	});

	it('translates the label to another language', () => {
		let entry!: EntryState;

		const rendered = render(() => {
			entry = new EntryState(xformDefinition);

			return <App entry={entry} />;
		});

		// TODO: the intent was actually to test this by selecting the menu item,
		// but resolving the menu item proved difficult. Probably better as an
		// e2e test?
		entry.translations!.setActiveLanguage('Español');

		const label = rendered.getByText(/^1\./);

		expect(label).toBeInTheDocument();
		expect(label.textContent).toBe('1. Pregunta uno');
	});
});
