/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @see {@link console}
 */
interface Console {
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/assert_static) */
	assert(condition?: boolean, ...data: any[]): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/clear_static) */
	clear(): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/count_static) */
	count(label?: string): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/countreset_static) */
	countReset(label?: string): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/debug_static) */
	debug(...data: any[]): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/dir_static) */
	dir(item?: any, options?: any): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/dirxml_static) */
	dirxml(...data: any[]): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/error_static) */
	error(...data: any[]): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/group_static) */
	group(...data: any[]): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/groupcollapsed_static) */
	groupCollapsed(...data: any[]): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/groupend_static) */
	groupEnd(): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/info_static) */
	info(...data: any[]): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/log_static) */
	log(...data: any[]): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/table_static) */
	table(tabularData?: any, properties?: string[]): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/time_static) */
	time(label?: string): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/timeend_static) */
	timeEnd(label?: string): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/timelog_static) */
	timeLog(label?: string, ...data: any[]): void;
	timeStamp(label?: string): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/trace_static) */
	trace(...data: any[]): void;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/warn_static) */
	warn(...data: any[]): void;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Available in
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/console#browser_compatibility | all target environments}.
 *
 * Normally this would be contributed by one of these common tsconfig settings:
 *
 * - {@link https://www.typescriptlang.org/tsconfig/#lib | `lib`}: `["DOM"]`
 * - {@link https://www.typescriptlang.org/tsconfig/#types | types}: `["node"]`
 *
 * Neither setting is in use by `src`, but we do expect the global to exist.
 *
 * This type is taken from the same declaration in TypeScript's DOM lib, so it
 * will also be compatible when referenced within tests.
 */
// eslint-disable-next-line no-var
declare var console: Console;
