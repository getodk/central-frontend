//// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App.tsx';

describe('App', () => {
	it('...', () => {
		const rendered = render(() => <App />);

		expect(rendered.getByText('Hello world 1')).toBeInTheDocument();
	});
});
