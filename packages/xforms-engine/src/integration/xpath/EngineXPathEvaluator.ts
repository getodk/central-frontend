import type {
  EvaluatorConvenienceMethodOptions,
  XFormsItextTranslationLanguage,
  XFormsItextTranslationMap,
  XFormsSecondaryInstanceMap,
} from '@getodk/xpath';
import { XFormsXPathEvaluator } from '@getodk/xpath';
import type { PrimaryInstance } from '../../instance/PrimaryInstance.ts';
import type { ItextTranslationRootDefinition } from '../../parse/model/ItextTranslationsDefinition.ts';
import type { SecondaryInstanceRootDefinition } from '../../parse/model/SecondaryInstance/SecondaryInstancesDefinition.ts';
import { engineDOMAdapter } from './adapter/engineDOMAdapter.ts';
import type { EngineXPathNode } from './adapter/kind.ts';
import type { DependentExpressionResultType } from '../../parse/expression/abstract/DependentExpression.ts';

interface EngineXPathEvaluatorOptions {
  readonly rootNode: PrimaryInstance;
  readonly itextTranslationsByLanguage: XFormsItextTranslationMap<ItextTranslationRootDefinition>;
  readonly secondaryInstancesById: XFormsSecondaryInstanceMap<SecondaryInstanceRootDefinition>;
}

export interface ComputedExpressionResults {
  readonly boolean: boolean;
  readonly nodes: EngineXPathNode[];
  readonly number: number;
  readonly string: string;
}

// TODO still think this deserves its own file
export interface Result<Type extends DependentExpressionResultType> {
  readonly success: boolean;
  readonly value: ComputedExpressionResults[Type] | undefined;
  readonly error: Error | undefined;
}

export class Success<Type extends DependentExpressionResultType> implements Result<Type> {
  readonly success = true;
  readonly value: ComputedExpressionResults[Type];
  readonly error = undefined;

  constructor(value: ComputedExpressionResults[Type]) {
    this.value = value;
  }
}

export class Failure<Type extends DependentExpressionResultType> implements Result<Type> {
  readonly success = false;
  readonly value = undefined;
  readonly error: Error;

  constructor(error: Error) {
    this.error = error;
  }
}

/**
 * A wrapper around the xpath Evaluator that returns Result objects instead of values and errors.
 */
export class EngineXPathEvaluator {
  readonly xpathEvaluator: XFormsXPathEvaluator<EngineXPathNode>;

  constructor(options: EngineXPathEvaluatorOptions) {
    this.xpathEvaluator = new XFormsXPathEvaluator({
      domAdapter: engineDOMAdapter,
      ...options,
    });
  }

  evaluateString(
    expression: string,
    options?: EvaluatorConvenienceMethodOptions<EngineXPathNode>
  ): Result<'string'> {
    try {
      return new Success<'string'>(this.xpathEvaluator.evaluateString(expression, options));
    } catch (e) {
      return new Failure(e as Error);
    }
  }

  evaluateNumber(
    expression: string,
    options?: EvaluatorConvenienceMethodOptions<EngineXPathNode>
  ): Result<'number'> {
    try {
      return new Success<'number'>(this.xpathEvaluator.evaluateNumber(expression, options));
    } catch (e) {
      return new Failure(e as Error);
    }
  }

  evaluateNodes(
    expression: string,
    options?: EvaluatorConvenienceMethodOptions<EngineXPathNode>
  ): Result<'nodes'> {
    try {
      return new Success<'nodes'>(this.xpathEvaluator.evaluateNodes(expression, options));
    } catch (e) {
      return new Failure(e as Error);
    }
  }

  evaluateBoolean(
    expression: string,
    options?: EvaluatorConvenienceMethodOptions<EngineXPathNode>
  ): Result<'boolean'> {
    try {
      return new Success<'boolean'>(this.xpathEvaluator.evaluateBoolean(expression, options));
    } catch (e) {
      return new Failure(e as Error);
    }
  }

  setActiveLanguage(
    language: XFormsItextTranslationLanguage | null
  ): XFormsItextTranslationLanguage | null {
    return this.xpathEvaluator.setActiveLanguage(language);
  }

  getActiveLanguage(): XFormsItextTranslationLanguage | null {
    return this.xpathEvaluator.getActiveLanguage();
  }

  getExplicitDefaultLanguage(): XFormsItextTranslationLanguage | null {
    return this.xpathEvaluator.getExplicitDefaultLanguage();
  }

  getLanguages(): readonly XFormsItextTranslationLanguage[] {
    return this.xpathEvaluator.getLanguages();
  }
}
