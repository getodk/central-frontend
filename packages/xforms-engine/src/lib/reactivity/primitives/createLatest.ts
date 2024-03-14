import type { Accessor, MemoOptions, SignalOptions } from 'solid-js';
import { createMemo } from 'solid-js';

const EQUALS_FALSE_OPTIONS = { equals: false } as const satisfies SignalOptions<unknown>;

declare global {
	// eslint-disable-next-line no-var
	var DEV: unknown;
}

const isDev = typeof DEV !== 'undefined' && Boolean(DEV);

type LatestAccessors<T> = readonly [Accessor<T>, ...Array<Accessor<T>>];

/**
 * Based entirely on
 * {@link https://github.com/solidjs-community/solid-primitives/blob/66feea63234eec7b8273a6dc8fb01fc62cb3e8ca/packages/memo/src/index.ts#L104 | the solid-primitives function of the same name}.
 * The only change is that types have been improved. Its JSDoc follows verbatim:
 *
 * A combined memo of multiple sources, last updated source will be the value of
 * the returned signal.
 * @param sources list of reactive calculations/signals/memos
 * @param options signal options
 * @returns signal with value of the last updated source
 * @example
 * const [count, setCount] = createSignal(1);
 * const [text, setText] = createSignal("hello");
 * const lastUpdated = createLatest([count, text]);
 * lastUpdated() // => "hello"
 * setCount(4)
 * lastUpdated() // => 4
 */
export const createLatest = <T, Accessors extends LatestAccessors<T>>(
	sources: Accessors,
	options?: MemoOptions<T>
): Accessor<T> => {
	let index: keyof typeof sources = 0;

	const memos = sources.map((source, i) => {
		return createMemo(
			() => {
				index = i;

				return source();
			},
			undefined,
			isDev ? { name: i + 1 + '. source', equals: false } : EQUALS_FALSE_OPTIONS
		);
	});

	return createMemo(
		() => {
			const tracked = memos.map((memo) => memo());
			const trackedIndex = index as keyof typeof tracked;

			return tracked[trackedIndex]! as T;
		},
		undefined,
		options
	);
};
