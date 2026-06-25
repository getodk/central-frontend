import { TRANSLATE, SUBMIT_PRESSED } from '@/lib/constants/injection-keys.ts';
import type { AnyFunction } from '@getodk/common/types/helpers.d.ts';
import type { RootNode } from '@getodk/xforms-engine';
import { createInstance } from '@getodk/xforms-engine';
import type { MountingOptions } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import { vi } from 'vitest';
import { reactive, ref } from 'vue';
import { odkThemePreset } from '../src/odk-theme-preset';

import selectControl from './fixtures/select-control.xml?raw';
import validation from './fixtures/1-validation.xml?raw';
import repeatWithMultipleChildren from './fixtures/10-repeat-with-multiple-children.xml?raw';
import repeatWithDynamicLabel from './fixtures/09-repeat-with-dynamic-label.xml?raw';
import rank from './fixtures/1-rank.xml?raw';
import staticSelects from './fixtures/1-static-selects.xml?raw';
import minimalForm from './fixtures/minimal.xform.xml?raw';
import itextBasic from './fixtures/01-itext-basic.xml?raw';
import calculateSimple from './fixtures/1-calculate-simple.xform.xml?raw';
import rankWithChoiceFilter from './fixtures/2-rank-with-choice-filter.xml?raw';
import simpleRequired from './fixtures/2-simple-required.xml?raw';
import xpathUnknownFunction from './fixtures/xpath-unknown-function.xml?raw';
import xpathSyntaxError from './fixtures/xpath-syntax-error.xml?raw';
import simpleDagCycle from './fixtures/simple-dag-cycle.xml?raw';

const fixtures: Record<string, any> = {
  'select-control.xml': selectControl,
  '1-validation.xml': validation,
  '10-repeat-with-multiple-children.xml': repeatWithMultipleChildren,
  '09-repeat-with-dynamic-label.xml': repeatWithDynamicLabel,
  '1-rank.xml': rank,
  '1-static-selects.xml': staticSelects,
  'minimal.xform.xml': minimalForm,
  '01-itext-basic.xml': itextBasic,
  '1-calculate-simple.xform.xml': calculateSimple,
  '2-rank-with-choice-filter.xml': rankWithChoiceFilter,
  '2-simple-required.xml': simpleRequired,
  'xpath-unknown-function.xml': xpathUnknownFunction,
  'xpath-syntax-error.xml': xpathSyntaxError,
  'simple-dag-cycle.xml': simpleDagCycle,
};

/**
 * @todo this does roughly the same thing as {@link getFormXml}, except it
 * conveys a clearer intent that the fixture being loaded is specifically
 * associated with one or more `@getodk/web-forms` tests. However, it's worth
 * considering whether it would be more useful to reference such fixtures by
 * `import`, e.g.:
 *
 * ```ts
 * import(`@getodk/common/fixtures/test-web-forms/${identifier}?raw`);
 * ```
 *
 * Even more useful might be to wrap such directly referenced fixtures in a
 * basic `.ts` module, so such imports can actually be statically analyzed like
 * any other real module import.
 */
export const getWebFormsTestFixture = (identifier: string): Promise<string> => {
  const xml = fixtures[identifier];
  if (xml == null) {
    throw new Error(`Could not find fixture with identifier: ${identifier}`);
  }
  return Promise.resolve(xml);
};

export const getFormXml = (fileName: string): Promise<string> => {
  const xml = fixtures[fileName];
  if (xml == null) {
    throw new Error(`Could not find fixture with file name: ${fileName}`);
  }
  return Promise.resolve(xml);
};

export const getReactiveForm = async (formPath: string): Promise<RootNode> => {
  const formXml = await getFormXml(formPath);
  const instance = await createInstance(formXml, {
    instance: {
      stateFactory: reactive,
    },
  });

  return instance.root;
};

type GlobalMountOptions = Required<MountingOptions<unknown>>['global'];

export const globalMountOptions: GlobalMountOptions = {
  plugins: [[PrimeVue, { theme: { preset: odkThemePreset } }]],
  provide: {
    [SUBMIT_PRESSED]: ref(false),
    [TRANSLATE]: (id: string) => id,
  },
  stubs: {
    teleport: true,
  },
};

// TODO: how the heck is `undefined` a key of anything?!
type StringKeyOf<T> = Extract<keyof T, string>;

type StringKeyOfDocument = StringKeyOf<Document>;

// prettier-ignore
export type DocumentPropertyName = {
	[PropertyName in StringKeyOfDocument]:
		Document[PropertyName] extends AnyFunction
			? never
			: PropertyName;
}[StringKeyOfDocument];

export const mockDocumentGetter = <PropertyName extends DocumentPropertyName>(
  propertyName: PropertyName,
  mockImplementation: () => Document[PropertyName]
) => {
  if (propertyName in document) {
    return vi.spyOn(document, propertyName, 'get').mockImplementation(mockImplementation);
  }

  const mock = vi.fn(mockImplementation);
  Object.defineProperty(document, propertyName, {
    get: mock,
    configurable: true,
  });
  return mock;
};
