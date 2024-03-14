import {
	bind,
	body,
	head,
	html,
	input,
	label,
	mainInstance,
	model,
	t,
	title,
} from '@odk-web-forms/common/test/fixtures/xform-dsl/index.ts';
import { EntryState, XFormDefinition } from '@odk-web-forms/xforms-engine';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { XFormView } from './XFormView.tsx';

describe('XFormView', () => {
	const xform = html(
		head(
			title('Minimal XForm'),
			model(
				mainInstance(
					t(
						'root id="minimal"',
						t('first-question'),
						t('second-question'),
						t('third-question'),
						t('meta', t('instanceID'))
					)
				),
				bind('/root/first-question').type('string'),
				bind('/root/second-question').type('string'),
				bind('/root/third-question').type('string'),
				bind('/root/meta/instanceID').type('string')
			)
		),
		body(
			input('/root/first-question', label('First question')),
			input('/root/second-question'),
			t('unknown-control ref="/root/third-question"')
		)
	);

	let xformDefinition: XFormDefinition;
	let rootElement: Element;
	let dispose: VoidFunction;

	beforeEach(() => {
		dispose = () => {
			throw new Error('Render must have failed');
		};

		rootElement = document.createElement('div');
	});

	afterEach(() => {
		dispose();
	});

	beforeEach(() => {
		xformDefinition = new XFormDefinition(xform.asXml());
	});

	it('renders the form title', () => {
		dispose = render(() => {
			const entry = new EntryState(xformDefinition);

			return <XFormView entry={entry} />;
		}, rootElement);

		expect(rootElement.textContent).toContain('Minimal XForm');
	});

	it('renders the first question', () => {
		dispose = render(() => {
			const entry = new EntryState(xformDefinition);

			return <XFormView entry={entry} />;
		}, rootElement);

		expect(rootElement.textContent).toContain('First question');
	});
});
