import type { ActiveLanguage } from './FormLanguage.ts';
import type { RootNodeState } from './RootNode.ts';

/**
 * @todo This (and everything else to do with {@link TextRange}s is for
 * illustration purposes, as a starting point where any particular detail is of
 * unknown utility. We can iterate on all aspects of text ranges in actual
 * clients and refine from there.
 *
 * @see {@link TextRange}
 */
export interface TextChunk {
	readonly source: 'itext' | 'output' | 'static';

	/**
	 * @see {@link ActiveLanguage} for additional commentary
	 */
	get language(): ActiveLanguage;

	get asString(): string;
	get formatted(): unknown;
}

/**
 * Represents aspects of a form which produce text, which _might_ be:
 *
 * - Computed from multiple sources
 * - Capable of conveying certain formatting (which may be presentational and/or
 *   structural)
 *
 * Computed text values may be updated by:
 *
 * - Changing a {@link RootNodeState.activeLanguage | form's active language}
 * - Changes to any state referenced by an
 *   {@link https://getodk.github.io/xforms-spec/#body-elements | output},
 *   within any text-presenting aspect of a form (e.g. labels and hints, as well
 *   as itext translations referenced by those)
 *
 * As a client interface, the intent is to convey that this text may be dynamic
 * (and thus potentially reactive for clients supplying a
 * {@link OpaqueReactiveObjectFactory}), and may produce multiple spans of text
 * (or none at all) depending on the structure and state of the form.
 *
 * @todo This interface should be considered **incomplete and in flux**, and
 * subject to change as we evaluate client needs and engine responsibilities. In
 * particular, we've deferred a notion of an interface for formatting aspects,
 * while leaving open the possibility that it may come in future iterations.
 *
 * {@link role} is intended to convey that individual text ranges may be
 * reasoned about differently by clients depending on their role (for instance,
 * a text range's role may correspond to the "short" or "guidance" `form` of a
 * {@link https://getodk.github.io/xforms-spec/#languages | translation}).
 */
export interface TextRange<Role extends string | null = null> {
	readonly role: Role;

	[Symbol.iterator](): Iterable<TextChunk>;

	get asString(): string;
	get formatted(): unknown;
}
