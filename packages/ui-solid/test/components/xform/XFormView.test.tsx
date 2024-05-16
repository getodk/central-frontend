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
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import type { RootNode } from '@getodk/xforms-engine';
import { initializeForm } from '@getodk/xforms-engine';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { XFormView } from '../../../src/components/XForm/XFormView.tsx';

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

	let root: RootNode;
	let rootElement: Element;
	let dispose: VoidFunction;

	beforeEach(async () => {
		dispose = () => {
			throw new Error('Render must have failed');
		};

		root = await initializeForm(xform.asXml());
		rootElement = document.createElement('div');
	});

	afterEach(() => {
		dispose();
	});

	it('renders the form title', () => {
		dispose = render(() => {
			return <XFormView root={root} />;
		}, rootElement);

		expect(rootElement.textContent).toContain('Minimal XForm');
	});

	it('renders the first question', () => {
		dispose = render(() => {
			return <XFormView root={root} />;
		}, rootElement);

		expect(rootElement.textContent).toContain('First question');
	});
});
