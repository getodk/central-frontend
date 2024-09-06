import type { AnyFunction } from '@getodk/common/types/helpers.d.ts';
import type { AnyControlNode, RootNode } from '@getodk/xforms-engine';
import { initializeForm } from '@getodk/xforms-engine';
import type { MountingOptions } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import type { MockInstance } from 'vitest';
import { vi } from 'vitest';
import { reactive } from 'vue';

const formFixtures = import.meta.glob<true, 'raw', string>(
	'../../ui-solid/fixtures/xforms/**/*.xml',
	{
		query: '?raw',
		import: 'default',
		eager: true,
	}
);

export const getFormXml = (formPath: string): string => {
	return formFixtures[`../../ui-solid/fixtures/xforms/${formPath}`];
};

export const getReactiveForm = async (formPath: string): Promise<RootNode> => {
	const formXml: string = formFixtures[`../../ui-solid/fixtures/xforms/${formPath}`];

	return await initializeForm(formXml, {
		config: {
			stateFactory: reactive,
		},
	});
};

type GlobalMountOptions = Required<MountingOptions<unknown>>['global'];

export const globalMountOptions: GlobalMountOptions = {
	plugins: [[PrimeVue, { ripple: false }]],
	provide: {
		submitPressed: false,
	},
	stubs: {
		teleport: true,
	},
};

export const fakeUnsupportedControlNode = () =>
	Object.assign({ nodeType: 'dummy', validationState: {} }, {} as AnyControlNode);

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
