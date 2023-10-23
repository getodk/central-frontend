import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';

describe('App', () => {
	it('tests rendering a component (temp, just to validate component testing works at all!)', () => {
		const rendered = render(() => <p>Hello</p>);

		expect(rendered.getByText('Hello')).toBeInTheDocument();
	});
});
