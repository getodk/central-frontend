import { beforeEach, describe, expect, it } from 'vitest';
import { ScopedElementLookup } from '../../../src/lib/dom/compatibility.ts';

describe('DOM compatibility library functions', () => {
	describe('querying direct children of an element', () => {
		let root: Element;
		let child: Element;
		let child2: Element;
		let descendant: Element;
		let descendant2: Element;
		let descendant3: Element;

		beforeEach(() => {
			const domParser = new DOMParser();
			const { documentElement } = domParser.parseFromString(
				/* xml */ `
				<root>
					<child>
						<descendant />
					</child>
					<child>
						<descendant />
					</child>
					<descendant />
				</root>
			`.trim(),
				'text/xml'
			);

			root = documentElement;
			child = root.firstElementChild!;
			child2 = child.nextElementSibling!;
			descendant = child.firstElementChild!;
			descendant2 = child2.firstElementChild!;
			descendant3 = child2.nextElementSibling!;
		});

		it('gets a direct child matching a selector', () => {
			const lookup = new ScopedElementLookup(':scope > child', 'child');
			const result = lookup.getElement(root);

			expect(result).toBe(child);
		});

		it('gets direct children matching a selector', () => {
			const lookup = new ScopedElementLookup(':scope > child', 'child');
			const results = Array.from(lookup.getElements(root));

			expect(results).toEqual([child, child2]);
		});

		it('does not get a descendant matching the selector', () => {
			const lookup = new ScopedElementLookup(':scope > descendant', 'descendant');
			const result = lookup.getElement(root);

			expect(result).not.toBe(descendant);
			expect(result).toBe(descendant3);
		});

		it('does not get descendants matching the selector', () => {
			const lookup = new ScopedElementLookup(':scope > descendant', 'descendant');
			const results = Array.from(lookup.getElements(root));

			expect(results).not.toEqual([descendant, descendant2]);
			expect(results).toEqual([descendant3]);
		});
	});
});
