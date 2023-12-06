const SUPPORTS_SCOPE_CHILD_SELECTOR = (() => {
	const parent = document.createElement('parent');
	const child1 = document.createElement('child1');
	const child2 = document.createElement('child2');

	child2.append(child1);
	parent.append(child2);

	return (
		parent.querySelector(':scope > child1') === child1 &&
		parent.querySelector(':scope > child2') !== child2
	);
})();

type ScopedSelector = `:scope > ${string}`;

type UnscopedSelector<Selector extends ScopedSelector> =
	Selector extends `:scope > ${infer Unscoped}` ? Unscoped : never;

type GetScopeChildBySelector = <Selector extends ScopedSelector>(
	element: Element,
	scopedSelector: Selector,
	unscopedSelector: UnscopedSelector<Selector>
) => Element | null;

/**
 * Provides compatibility for `ParentNode.querySelector(':scope > $SELECTOR')`
 * in environments where the `:scope > ` prefix is ignored (e.g.
 * {@link https://github.com/jsdom/jsdom/issues/3067 | jsdom}).
 *
 * Both the scoped and unscoped selector should be provided, to avoid a common
 * deoptimization caused by producing selectors dynamically.
 */
export const getScopeChildBySelector = (() => {
	if (SUPPORTS_SCOPE_CHILD_SELECTOR) {
		return ((element, scopedSelector) => {
			return element.querySelector(scopedSelector);
		}) satisfies GetScopeChildBySelector;
		// ^ Note `satisfies` here (and below) allows TypeScript to infer the
		// literal type rather than referencing it by name, which is generally
		// easier to work with from a call site.
	}

	// `scopedSelector` isn't used for this compatibility fallback, but it's
	// included here as part of the inferred function signature.
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return ((element, scopedSelector, unscopedSelector) => {
		const children = Array.from(element.children);
		const result = children.find((child) => child.matches(unscopedSelector));

		return result ?? null;
	}) satisfies GetScopeChildBySelector;
})();
