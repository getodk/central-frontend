import type { DefaultDOMAdapterNode } from '../src/adapter/defaults.ts';
import { DefaultXFormsXPathEvaluator } from '../src/xforms/DefaultXFormsXPathEvaluator.ts';
import { XFormsXPathEvaluator } from '../src/xforms/XFormsXPathEvaluator.ts';

/**
 * @todo All of the behavior in {@link DefaultXFormsXPathEvaluator} should be
 * moved here (and renamed as appropriate) once `@getodk/xforms-engine` has
 * transitioned to:
 *
 * - The forthcoming DOM adapter approach
 * - Direct access to options now required by {@link XFormsXPathEvaluator} (i.e.
 *   secondary instances, itext translations)
 */
export class TestXFormsXPathEvaluator
	extends DefaultXFormsXPathEvaluator
	implements XFormsXPathEvaluator<DefaultDOMAdapterNode> {}
