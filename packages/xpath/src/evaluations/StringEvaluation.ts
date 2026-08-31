import type { XPathNode } from '../adapter/interface/XPathNode.ts';
import type { LocationPathEvaluation } from './LocationPathEvaluation.ts';
import { ValueEvaluation } from './ValueEvaluation.ts';

const parseNumber = (value: string) => Number(value.replace(',', '.'));

export class StringEvaluation<T extends XPathNode> extends ValueEvaluation<T, 'STRING'> {
  readonly type = 'STRING';
  readonly nodes = null;

  protected readonly booleanValue: boolean;
  protected readonly numberValue: number;
  protected readonly stringValue: string;

  constructor(
    readonly context: LocationPathEvaluation<T>,
    readonly value: string,
    readonly isEmpty: boolean = value === ''
  ) {
    super();

    this.booleanValue = !isEmpty;
    this.numberValue = isEmpty ? NaN : parseNumber(value);
    this.stringValue = value;

    const numberFunction = context.functions.getDefaultImplementation('number');

    if (isEmpty) {
      this.numberValue = NaN;
    } else if (numberFunction === null) {
      this.numberValue = parseNumber(value);
    } else {
      try {
        this.numberValue = numberFunction
          .call(context, [
            {
              evaluate: () => this,
            },
          ])
          .toNumber();
      } catch {
        this.numberValue = parseNumber(value);
      }
    }
  }
}
