import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { XFormTitle } from './XFormTitle.tsx';

describe('XFormTitle', () => {
	it('renders the title', () => {
		const rendered = render(() => <XFormTitle>Hello</XFormTitle>);

		expect(rendered).not.toBe(null);
		expect(rendered.getByText('Hello')).toBeInTheDocument();
	});
});
