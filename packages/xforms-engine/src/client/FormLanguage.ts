interface BaseFormLanguage {
	/**
	 * @see {@link ActiveLanguage} for details.
	 */
	readonly isSyntheticDefault?: true;

	/**
	 * As derived directly from the form's
	 * {@link https://getodk.github.io/xforms-spec/#languages | `itext` translations}.
	 */
	readonly language: string;

	/**
	 * Where possible, a form's languages may detect the standardized locale
	 * corresponding to the language as specified in the form.
	 */
	// NOTE: this is proposed, hypothetical future functionality. Enketo has
	// similar functionality, but we'll want to seriously consider how best to
	// accomplish this if/as it becomes a priority.
	readonly locale?: Intl.Locale;
}

/**
 * @see {@link ActiveLanguage} for details.
 */
export interface SyntheticDefaultLanguage extends BaseFormLanguage {
	readonly isSyntheticDefault: true;
	readonly language: '';
}

/**
 * A language available for a given form, as defined by that form's {@link https://getodk.github.io/xforms-spec/#languages | `itext` translations}.
 *
 * @see {@link ActiveLanguage} for additional details.
 */
export interface FormLanguage extends BaseFormLanguage {
	readonly isSyntheticDefault?: never;
}

/**
 * A form with translations will always have one or more {@link FormLanguage}s,
 * with the default chosen as described in the ODK XForms specification.
 *
 * A form that specifies no translations will always have a single
 * {@link SyntheticDefaultLanguage}.
 *
 * No form will ever combine both types of language.
 *
 * This distinction is intended to avoid confusion about the **potential** state
 * of a form's active language. A naive type to express the possibility, without
 * a synthetic default, would be something like `FormLanguage | null`, which
 * would seem to suggest to a client that a form may **only sometimes** have an
 * active language—for instance, that there might be a way for a client to turn
 * translation off and on.
 *
 * By ensuring there is always _some active language value_, and by expressing
 * the {@link FormLanguages} type to correspond to each of the possibilities
 * discussed above, it's hoped that the set of potential translation states a
 * client might encounter/establish are more clear.
 */
// prettier-ignore
export type ActiveLanguage =
	| FormLanguage
	| SyntheticDefaultLanguage;

/**
 * A form may either have:
 *
 * - one or more available {@link FormLanguage}s, as defined by the form
 * - exactly one {@link SyntheticDefaultLanguage}
 *
 * @see {@link ActiveLanguage} for additional details.
 */
// prettier-ignore
export type FormLanguages =
	| readonly [FormLanguage, ...FormLanguage[]]
	| readonly [SyntheticDefaultLanguage];
