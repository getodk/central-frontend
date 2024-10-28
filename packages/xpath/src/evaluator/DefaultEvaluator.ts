import type { DefaultDOMAdapterNode } from '../adapter/defaults.ts';
import { DEFAULT_DOM_ADAPTER } from '../adapter/defaults.ts';
import type { XPathDOMAdapter } from '../adapter/interface/XPathDOMAdapter.ts';
import type { EvaluatorOptions } from './Evaluator.ts';
import { Evaluator } from './Evaluator.ts';

export interface DefaultEvaluatorOptions
	extends Omit<EvaluatorOptions<DefaultDOMAdapterNode>, 'domAdapter'> {}

/**
 * The default {@link Evaluator} implementation is suitable for use in a browser
 * runtime, or in a browser DOM compatibility environment.
 *
 * @todo Give this a more descriptive name? Make {@link Evaluator} the actual
 * default, and give {@link Evaluator} itself a more descriptive name? I.e.
 * describing the fact that it supports—and requires—an explicit
 * {@link XPathDOMAdapter} option.
 */
export class DefaultEvaluator extends Evaluator<DefaultDOMAdapterNode> {
	constructor(options?: DefaultEvaluatorOptions) {
		super({
			...options,
			domAdapter: DEFAULT_DOM_ADAPTER,
		});
	}
}
