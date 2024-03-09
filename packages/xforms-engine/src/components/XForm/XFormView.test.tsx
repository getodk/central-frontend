import { render } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it } from 'vitest';
import { XFormDefinition } from '../../lib/xform/XFormDefinition.ts';
import { EntryState } from '../../lib/xform/state/EntryState.ts';
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
} from '../../test/fixtures/xform-dsl/index.ts';
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

	beforeEach(() => {
		xformDefinition = new XFormDefinition(xform.asXml());
	});

	it('renders the form title', () => {
		const rendered = render(() => {
			const entry = new EntryState(xformDefinition);

			return <XFormView entry={entry} />;
		});

		expect(rendered.getByText('Minimal XForm')).toBeInTheDocument();
	});

	it('renders the first question', () => {
		const rendered = render(() => {
			const entry = new EntryState(xformDefinition);

			return <XFormView entry={entry} />;
		});

		expect(rendered.getByText('First question')).toBeInTheDocument();
	});
});
