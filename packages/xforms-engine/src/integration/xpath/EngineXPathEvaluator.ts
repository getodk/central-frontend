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

export interface Success<T extends DependentExpressionResultType> {
  readonly success: true;
  readonly value: ComputedExpressionResults[T];
}

export interface Failure {
  readonly success: false;
  readonly error: Error;
}

export type Result<T extends DependentExpressionResultType> = Failure | Success<T>;

export class EngineXPathEvaluator {
  readonly xpathEvaluator: XFormsXPathEvaluator<EngineXPathNode>;

  constructor(options: EngineXPathEvaluatorOptions) {
    this.xpathEvaluator = new XFormsXPathEvaluator({
      domAdapter: engineDOMAdapter,
      ...options,
    });
  }

  // TODO pull out this repeating pattern
  evaluateString(
    expression: string,
    options?: EvaluatorConvenienceMethodOptions<EngineXPathNode>
  ): Result<'string'> {
    try {
      return {
        success: true,
        value: this.xpathEvaluator.evaluateString(expression, options),
      };
    } catch (e) {
      return {
        success: false,
        error: e as Error,
      };
    }
  }

  evaluateNumber(
    expression: string,
    options?: EvaluatorConvenienceMethodOptions<EngineXPathNode>
  ): Result<'number'> {
    try {
      return {
        success: true,
        value: this.xpathEvaluator.evaluateNumber(expression, options),
      };
    } catch (e) {
      return {
        success: false,
        error: e as Error,
      };
    }
  }

  evaluateNodes(
    expression: string,
    options?: EvaluatorConvenienceMethodOptions<EngineXPathNode>
  ): Result<'nodes'> {
    try {
      return {
        success: true,
        value: this.xpathEvaluator.evaluateNodes(expression, options),
      };
    } catch (e) {
      return {
        success: false,
        error: e as Error,
      };
    }
  }

  evaluateBoolean(
    expression: string,
    options?: EvaluatorConvenienceMethodOptions<EngineXPathNode>
  ): Result<'boolean'> {
    try {
      return {
        success: true,
        value: this.xpathEvaluator.evaluateBoolean(expression, options),
      };
    } catch (e) {
      return {
        success: false,
        error: e as Error,
      };
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
