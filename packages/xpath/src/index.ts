/**
 * @module @getodk/xpath
 *
 * Currently the main entrypoint for:
 *
 * - {@link Evaluator}, associated types
 * - {@link XPathDOMAdapter}, associated values and types
 * - {@link DefaultEvaluator}, associated types
 * - {@link XFormsXPathEvaluator}, associated types
 * - {@link DefaultXFormsXPathEvaluator}, associated types (tempoary)
 *
 * @todo Break out distinct entrypoints for each.
 * @todo Seriously consider moving all XForms-specific functionality down the
 * stack instead of breaking those parts out.
 */

import type { XPathDOMAdapter } from './adapter/interface/XPathDOMAdapter.ts';
import type { DefaultEvaluator } from './evaluator/DefaultEvaluator.ts';
import type { Evaluator } from './evaluator/Evaluator.ts';
import type { DefaultXFormsXPathEvaluator } from './xforms/DefaultXFormsXPathEvaluator.ts';
import type { XFormsXPathEvaluator } from './xforms/XFormsXPathEvaluator.ts';

/**
 * - - -
 * {@link Evaluator}, associated types
 * - - -
 */

export type * from './evaluator/Evaluator.ts';
export { Evaluator } from './evaluator/Evaluator.ts';

/**
 * - - -
 * {@link XPathDOMAdapter}, associated values and types
 * - - -
 */

export * from './adapter/defaults.ts';
export * from './adapter/interface/XPathDOMAdapter.ts';

/**
 * - - -
 * {@link DefaultEvaluator}, associated types
 * - - -
 */

export type * from './evaluator/DefaultEvaluator.ts';
export { DefaultEvaluator } from './evaluator/DefaultEvaluator.ts';

/**
 * - - -
 * {@link XFormsXPathEvaluator}, associated values and types
 * - - -
 */

export type * from './xforms/XFormsElementRepresentation.ts';
export { XFORMS_KNOWN_ATTRIBUTE, XFORMS_LOCAL_NAME } from './xforms/XFormsElementRepresentation.ts';
export type {
	XFormsItextTranslationElement,
	XFormsItextTranslationLanguage,
	XFormsItextTranslationMap,
} from './xforms/XFormsItextTranslations.ts';
export type {
	XFormsSecondaryInstanceElement,
	XFormsSecondaryInstanceMap,
} from './xforms/XFormsSecondaryInstances.ts';
export type {
	XFormsXPathEvaluatorOptions,
	XFormsXPathRootNode,
} from './xforms/XFormsXPathEvaluator.ts';

/**
 * - - -
 * {@link DefaultXFormsXPathEvaluator}, associated types (temporary)
 * - - -
 */

export type * from './xforms/DefaultXFormsXPathEvaluator.ts';
export { DefaultXFormsXPathEvaluator as XFormsXPathEvaluator } from './xforms/DefaultXFormsXPathEvaluator.ts';
