/**
 * Derived from
 * {@link https://github.com/solidjs/solid-testing-library/blob/805c3f70961d956d1ffacb08d435535e71d50398/src/types.ts}
 *
 * Modified to address type strictness errors (largely by loosening types :/)
 */

import type { RouteDataFunc } from '@solidjs/router';
import type { BoundFunctions, Queries, prettyFormat } from '@testing-library/dom';
import { queries } from '@testing-library/dom';
import type { Accessor, Component, JSX, Owner, Setter } from 'solid-js';

export interface Ref {
	container?: HTMLElement;
	dispose: () => void;
}

export type Ui = () => JSX.Element;

export interface Options {
	container?: HTMLElement;
	baseElement?: HTMLElement;
	queries?: Queries & typeof queries;
	hydrate?: boolean;
	wrapper?: Component<{ children: JSX.Element }>;
	readonly location?: string;
	routeDataFunc?: RouteDataFunc;
}

export type DebugFn = (
	baseElement?: HTMLElement | HTMLElement[],
	maxLength?: number,
	options?: prettyFormat.OptionsReceived
) => void;

export type Result = BoundFunctions<typeof queries> & {
	asFragment: () => string;
	container: HTMLElement;
	baseElement: HTMLElement;
	debug: DebugFn;
	unmount: () => void;
};

export type RenderHookOptions<A extends unknown[]> =
	| A
	| {
			initialProps?: A;
			wrapper?: Component<{ children: JSX.Element }>;
	  };

export interface RenderHookResult<R> {
	result: R | undefined;
	owner: Owner | null;
	cleanup: () => void;
}

export type RenderDirectiveOptions<A, E extends HTMLElement = HTMLDivElement> = Options & {
	initialValue?: A;
	targetElement?: E | Lowercase<E['nodeName']> | (() => E);
};

export type RenderDirectiveResult<A> = Result & {
	arg: Accessor<A>;
	setArg: Setter<A>;
};
