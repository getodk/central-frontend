import type { ActiveLanguage } from './FormLanguage.ts';
import type { RootNodeState } from './RootNode.ts';

/**
 * **COMMENTARY**
 *
 * The spec makes naming and mapping these cases a bit more complex than would
 * be ideal. The intent is to clearly identify distinct text definitions (and
 * sub-structural parts) from a source form, in a way that semantically lines up
 * with the ways they will need to be handled at runtime and conveyed to
 * clients. This is the mapping:
 *
 * - 'output': All output values, i.e.:
 *   - `output/@value`
 *
 * - 'translation':
 *
 *   - Valid XPath translation expressions, in a context accepting mixed
 *     translation/static syntax, i.e.:
 *
 *     - `h:head//bind/@jr:constraintMsg[is-translation-expr()]`
 *     - `h:head//bind/@jr:requiredMsg[is-translation-expr()]`
 *
 *       Here, `is-translation-expr()` is a fictional shorthand for checking
 *       that the attribute's value is a valid `jr:itext(...)` FunctionCall
 *       expression. Note that, per spec, these attributes **do not accept
 *       arbitrary XPath expressions**! The non-translation case is  treated as
 *       static text, not parsed for e.g. an XPath [string] Literal expression.
 *       This is why we have introduced this 'translation' case, distinct from
 *       'reference', which previously handled translated labels and hints.
 *
 *   - Valid XPath translation expressions, in a context accepting arbitrary
 *     XPath expressions, i.e.:
 *
 *     - `h:body//label/@ref[is-translation-expr()]`
 *
 * - 'static':
 *   - `h:head//bind/@jr:constraintMsg[not(is-translation-expr())]`
 *   - `h:head//bind/@jr:requiredMsg[not(is-translation-expr())]`
 *   - `h:body//label/text()`
 *   - `h:body//hint/text()`
 *
 *   (See notes above for clarification of `is-translation-expr()`.)
 *
 * - 'reference': Any XPath **non-translation** expression defined as a label's
 *   (or hint's) `ref` attribute, i.e.
 *   - `h:body//label/@ref[not(is-translation-expr())]`
 *   - `h:body//hint/@ref[not(is-translation-expr())]`
 *
 *   (See notes above for clarification of `is-translation-expr()`.)
 *
 * @todo It's unclear whether this will all become simpler or more compelex when
 * we add support for outputs in translations. In theory, the actual translation
 * `<text>` nodes map quite well to the `TextRange` concept (i.e. they are a
 * range of static and output chunks, just like labels and hints). The potential
 * for complications arise from XPath implementation details being largely
 * opaque (as in, the `jr:itext` implementation is encapsulated in the `xpath`
 * package, and the engine doesn't really deal with itext translations at the
 * node level at all).
 */
// prettier-ignore
export type TextChunkSource =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'output'
	| 'reference'
	| 'translation'
	| 'static';

/**
 * @todo This (and everything else to do with {@link TextRange}s is for
 * illustration purposes, as a starting point where any particular detail is of
 * unknown utility. We can iterate on all aspects of text ranges in actual
 * clients and refine from there.
 *
 * @see {@link TextRange}
 */
export interface TextChunk {
	readonly source: TextChunkSource;

	/**
	 * @see {@link ActiveLanguage} for additional commentary
	 */
	get language(): ActiveLanguage;

	get asString(): string;
	get formatted(): unknown;
}

// eslint-disable-next-line @typescript-eslint/sort-type-constituents
export type ElementTextRole = 'hint' | 'label' | 'item-label';
export type ValidationTextRole = 'constraintMsg' | 'requiredMsg';
export type TextRole = ElementTextRole | ValidationTextRole;

/**
 * Specifies the origin of a {@link TextRange}.
 *
 * - 'form': text is computed from the form definition, as specified for the
 *   {@link TextRole}. User-facing clients should present text with this origin
 *   where appropriate.
 *
 * - 'form-derived': the form definition lacks a text definition for the
 *   {@link TextRole}, but an appropriate one has been derived from a related
 *   (and semantically appropriate) aspect of the form (example: a select item
 *   without a label may derive that label from the item's value). User-facing
 *   clients should generally present text with this origin where provided; this
 *   origin clarifies the source of such text.
 *
 * - 'engine': the form definition lacks a definition for the {@link TextRole},
 *   but provides a constant default in its absence. User facing clients may
 *   disregard these constant text values, or may use them where a sensible
 *   default is desired. Clients may also use these constants as keys for
 *   translation purposes, as appropriate. Non-user facing clients may reference
 *   these constants for e.g. testing purposes.
 */
// prettier-ignore
export type TextOrigin =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'form'
	| 'form-derived'
	| 'engine';

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
export interface TextRange<Role extends TextRole, Origin extends TextOrigin = TextOrigin> {
	readonly origin: Origin;
	readonly role: Role;

	[Symbol.iterator](): Iterable<TextChunk>;

	get asString(): string;
	get formatted(): unknown;
}
