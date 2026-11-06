import type {
  JRResourceURLString,
  ResourceType,
} from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { KnownAttributeLocalNamedElement } from '@getodk/common/types/dom.ts';
import type { TextChunkSource } from '../../client/TextRange.ts';
import { getTranslationExpression } from '../xpath/semantic-analysis.ts';
import { DependentExpression } from './abstract/DependentExpression.ts';

export type TextForm = 'guidance';

export const isTextForm = (string: string): string is TextForm => {
  return string === 'guidance';
};

interface TextChunkExpressionOptions {
  readonly resourceType?: ResourceType | undefined;
  readonly textForm?: TextForm | undefined;
}

interface OutputElement extends KnownAttributeLocalNamedElement<'output', 'value'> {}

const isOutputElement = (element: Element): element is OutputElement => {
  return element.localName === 'output' && element.hasAttribute('value');
};

export class TextChunkExpression<T extends 'nodes' | 'string'> extends DependentExpression<T> {
  readonly source: TextChunkSource;
  // Set for the literal source, blank otherwise
  readonly stringValue: string;
  readonly resourceType: ResourceType | null;
  readonly textForm: TextForm | null;

  constructor(
    resultType: T,
    expression: string,
    source: TextChunkSource,
    literalValue = '',
    options: TextChunkExpressionOptions = {}
  ) {
    super(resultType, expression);

    this.resourceType = options.resourceType ?? null;
    this.textForm = options.textForm ?? null;
    this.source = source;
    this.stringValue = literalValue;
  }

  static fromLiteral(stringValue: string, textForm?: TextForm): TextChunkExpression<'string'> {
    return new TextChunkExpression('string', 'null', 'literal', stringValue, { textForm });
  }

  static fromReference(ref: string): TextChunkExpression<'string'> {
    return new TextChunkExpression('string', ref, 'reference');
  }

  static fromOutput(element: Element, textForm?: TextForm): TextChunkExpression<'string'> | null {
    if (!isOutputElement(element)) {
      return null;
    }

    return new TextChunkExpression('string', element.getAttribute('value'), 'output', '', {
      textForm,
    });
  }

  static fromResource(
    url: JRResourceURLString,
    resourceType: ResourceType
  ): TextChunkExpression<'string'> {
    return new TextChunkExpression('string', 'null', 'literal', url, { resourceType });
  }

  static fromTranslation(maybeExpression: string): TextChunkExpression<'nodes'> | null {
    const translationExpression = getTranslationExpression(maybeExpression);
    if (translationExpression) {
      return new TextChunkExpression('nodes', translationExpression, 'translation');
    }

    return null;
  }
}
