/**
 * Shared type, available in
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/atob#browser_compatibility | all target environments}.
 *
 * Normally this would be contributed by one of these common tsconfig settings:
 *
 * - {@link https://www.typescriptlang.org/tsconfig/#lib | `lib`}: `["DOM"]`
 * - {@link https://www.typescriptlang.org/tsconfig/#types | types}: `["node"]`
 *
 *
 * Neither setting is in use by `src`, but we do expect the global to exist.
 *
 * This type is taken from the same declaration in TypeScript's DOM lib, so it
 * will also be compatible when referenced within tests.
 */
// eslint-disable-next-line no-var -- consistency with upstream types
declare var atob: (value: string) => string;
