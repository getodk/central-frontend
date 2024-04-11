import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { XFormTitle } from '../../../src/components/XForm/XFormTitle.tsx';

describe('XFormTitle', () => {
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

	it('renders the title', () => {
		dispose = render(() => <XFormTitle>Hello</XFormTitle>, rootElement);

		expect(rootElement.textContent).toContain('Hello');
	});
});
