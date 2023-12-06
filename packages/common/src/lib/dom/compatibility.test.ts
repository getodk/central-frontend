import { beforeEach, describe, expect, it } from 'vitest';
import { getScopeChildBySelector } from './compatibility';

describe('DOM compatibility library functions', () => {
	describe('querying direct children of an element', () => {
		let root: Element;
		let child: Element;
		let descendant: Element;

		beforeEach(() => {
			const domParser = new DOMParser();
			const { documentElement } = domParser.parseFromString(
				/* xml */ `
				<root>
					<child>
						<descendant />
					</child>
				</root>
			`.trim(),
				'text/xml'
			);

			root = documentElement;
			child = root.firstElementChild!;
			descendant = child.firstElementChild!;
		});

		it('gets a direct child matching a selector', () => {
			const result = getScopeChildBySelector(root, ':scope > child', 'child');

			expect(result).toBe(child);
		});

		it('does not get a descendant matching the selector', () => {
			const result = getScopeChildBySelector(root, ':scope > descendant', 'descendant');

			expect(result).not.toBe(descendant);
			expect(result).toBe(null);
		});
	});
});
