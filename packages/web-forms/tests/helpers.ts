import { xformFixturesByIdentifier } from '@getodk/common/fixtures/xforms.ts';
import type { AnyFunction } from '@getodk/common/types/helpers.d.ts';
import type { RootNode } from '@getodk/xforms-engine';
import { createInstance } from '@getodk/xforms-engine';
import type { MountingOptions } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import type { MockInstance } from 'vitest';
import { vi } from 'vitest';
import { reactive } from 'vue';
import { odkThemePreset } from '../src/odkThemePreset';

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
	const fixture = xformFixturesByIdentifier.get(identifier);

	if (fixture?.category !== 'test-web-forms') {
		throw new Error(`Could not find web-forms test fixture with identifier: ${identifier}`);
	}

	return fixture.loadXML();
};

export const getFormXml = (fileName: string): Promise<string> => {
	const fixture = xformFixturesByIdentifier.get(fileName);

	if (fixture == null) {
		throw new Error(`Could not find fixture with file name: ${fileName}`);
	}

	return fixture.loadXML();
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
		submitPressed: false,
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

type StringKeyOfHTMLElement = StringKeyOf<HTMLElement>;

// prettier-ignore
export type ElementMethodName = {
	[PropertyName in StringKeyOfHTMLElement]:
		HTMLElement[PropertyName] extends AnyFunction
			? PropertyName
			: never;
}[keyof HTMLElement];

type ElementMethodMock<MethodName extends ElementMethodName> = (
	this: HTMLElement,
	...args: Parameters<HTMLElement[MethodName]>
) => ReturnType<HTMLElement[MethodName]>;

export const mockElementPrototypeMethod = <MethodName extends ElementMethodName>(
	methodName: MethodName,
	mockImplementation: ElementMethodMock<MethodName>
) => {
	if (methodName in HTMLElement.prototype) {
		const mock = vi.spyOn<HTMLElement, MethodName>(
			HTMLElement.prototype,
			methodName
		) as MockInstance<HTMLElement[MethodName]>;

		return mock.mockImplementation(mockImplementation);
	}
	const mock = vi.fn(mockImplementation);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
	HTMLElement.prototype[methodName] = mock as any;
	return mock;
};
