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

// prettier-ignore
type ScopedElementLookupContextNode =
	| Document
	| DocumentFragment
	| Element
	| XMLDocument;

type GetScopedElement = <Selector extends ScopedSelector, T extends Element = Element>(
	lookup: ScopedElementLookup<Selector>,
	contextNode: ScopedElementLookupContextNode
) => T | null;

type GetScopedElements = <Selector extends ScopedSelector, T extends Element = Element>(
	lookup: ScopedElementLookup<Selector>,
	contextNode: ScopedElementLookupContextNode
) => Iterable<T>;

const getScopedElement: GetScopedElement = (() => {
	if (SUPPORTS_SCOPE_CHILD_SELECTOR) {
		return <Selector extends ScopedSelector, T extends Element = Element>(
			lookup: ScopedElementLookup<Selector>,
			contextNode: ScopedElementLookupContextNode
		): T | null => {
			return contextNode.querySelector<T>(lookup.scopedSelector);
		};
	}

	return <Selector extends ScopedSelector, T extends Element = Element>(
		lookup: ScopedElementLookup<Selector>,
		contextNode: ScopedElementLookupContextNode
	): T | null => {
		const { unscopedSelector } = lookup;

		for (const child of contextNode.children) {
			if (child.matches(unscopedSelector)) {
				return child as T;
			}
		}

		return null;
	};
})();

const getScopedElements: GetScopedElements = (() => {
	if (SUPPORTS_SCOPE_CHILD_SELECTOR) {
		return <Selector extends ScopedSelector, T extends Element = Element>(
			lookup: ScopedElementLookup<Selector>,
			contextNode: ScopedElementLookupContextNode
		): Iterable<T> => {
			return contextNode.querySelectorAll<T>(lookup.scopedSelector);
		};
	}

	return <Selector extends ScopedSelector, T extends Element = Element>(
		lookup: ScopedElementLookup<Selector>,
		contextNode: ScopedElementLookupContextNode
	): Iterable<T> => {
		const { unscopedSelector } = lookup;

		return Array.from(contextNode.children).filter((child): child is T => {
			return child.matches(unscopedSelector);
		});
	};
})();

/**
 * Provides compatibility for `ParentNode.querySelector(':scope > $SELECTOR')`
 * (and `querySelectorAll`) in environments where the `:scope > ` prefix is
 * ignored (e.g. {@link https://github.com/jsdom/jsdom/issues/3067 | jsdom}).
 *
 * Both the scoped and unscoped selector should be provided, to avoid a common
 * deoptimization caused by producing selectors dynamically.
 */
export class ScopedElementLookup<Selector extends ScopedSelector = ScopedSelector> {
	constructor(
		readonly scopedSelector: Selector,
		readonly unscopedSelector: UnscopedSelector<Selector>
	) {}

	/**
	 * WARNING: `T` is unchecked at runtime, use with caution!
	 */
	getElement<T extends Element = Element>(contextNode: ScopedElementLookupContextNode): T | null {
		return getScopedElement(this, contextNode);
	}

	/**
	 * WARNING: `T` is unchecked at runtime, use with caution!
	 */
	getElements<T extends Element = Element>(
		contextNode: ScopedElementLookupContextNode
	): Iterable<T> {
		return getScopedElements(this, contextNode);
	}
}

type UnscopedSelector<Selector extends ScopedSelector> =
	Selector extends `:scope > ${infer Unscoped}` ? Unscoped : never;
