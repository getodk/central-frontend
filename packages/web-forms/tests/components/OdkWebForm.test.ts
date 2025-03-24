import type { OdkWebFormsProps } from '@/components/OdkWebForm.vue';
import OdkWebForm from '@/components/OdkWebForm.vue';
import type { ResolvableInstanceAttachmentsMap } from '@getodk/xforms-engine';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getFormXml,
	getWebFormsTestFixture,
	globalMountOptions,
	mockElementPrototypeMethod,
	type ElementMethodName,
} from '../helpers';

interface MountComponentOptions {
	readonly overrideProps?: Partial<OdkWebFormsProps>;
}

const mountComponent = (formXML: string, options?: MountComponentOptions) => {
	const component = mount(OdkWebForm, {
		props: {
			formXml: formXML,
			fetchFormAttachment: () => {
				throw new Error('Not exercised here');
			},
			...options?.overrideProps,
		},
		global: globalMountOptions,
		attachTo: document.body,
	});

	return component;
};

describe('OdkWebForm', () => {
	let formXML: string;
	let elementKeysAdded: ElementMethodName[];

	beforeEach(async () => {
		formXML = await getFormXml('2-simple-required.xml');

		elementKeysAdded = [];
		mockElementPrototypeMethod('scrollTo', () => {
			/* Do nothing */
		});
		mockElementPrototypeMethod('showPopover', function () {
			this.style.display = 'block';
		});
		mockElementPrototypeMethod('hidePopover', function () {
			this.style.display = 'none';
		});
	});

	afterEach(() => {
		elementKeysAdded.forEach((methodName) => {
			delete HTMLElement.prototype[methodName];
		});
		vi.restoreAllMocks();
	});

	it('shows validation banner and highlights on submit and hide once valid value(s) are set', async () => {
		const component = mountComponent(formXML);
		await flushPromises();

		// Assert no validation banner and no highlighted question
		expect(component.get('.form-error-message').isVisible()).toBe(false);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(false);

		// Click submit
		await component.get('button[aria-label="Send"]').trigger('click');

		// Assert validation banner is visible and question container is highlighted
		expect(component.get('.form-error-message').isVisible()).toBe(true);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(true);

		// Enter text to make question valid
		await component.get('input.p-inputtext').setValue('ok');

		// Assert no validation banner and no highlighted question
		expect(component.find('.form-error-message').isVisible()).toBe(false);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(false);
	});

	it('shows validation banner and highlights again if any question becomes invalid again', async () => {
		const component = mountComponent(formXML);
		await flushPromises();

		// Assert no validation banner and no highlighted question
		expect(component.get('.form-error-message').isVisible()).toBe(false);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(false);

		// Click submit
		await component.get('button[aria-label="Send"]').trigger('click');

		// Assert validation banner is visible and question container is highlighted
		expect(component.get('.form-error-message').isVisible()).toBe(true);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(true);

		// Enter text to make question valid
		await component.get('input.p-inputtext').setValue('ok');

		// Assert no validation banner and no highlighted question
		expect(component.find('.form-error-message').isVisible()).toBe(false);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(false);

		// Empty the textbox to make it invalid again
		await component.get('input.p-inputtext').setValue('');

		// Assert validation banner is visible and question container is highlighted again
		expect(component.get('.form-error-message').isVisible()).toBe(true);
		expect(component.get('.question-container').classes().includes('highlight')).toBe(true);
	});

	describe('form load failure', () => {
		// TODO: this test uses a fixture which currently causes engine-internal
		// reactivity (Solid) to produce a "potential infinite loop" error.
		// Triggering this error is slow: detection uses a heuristic of a hard limit
		// on the reactive call stack depth. When we reintroduce cycle detection in
		// the future, we will probably want to remove this timeout option!
		it(
			'presents an error message when failing to load a form with a cyclic computation',
			{ timeout: 5000 },
			async () => {
				const dagCycleFormXML = await getWebFormsTestFixture('simple-dag-cycle.xml');
				const component = mountComponent(dagCycleFormXML);

				await flushPromises();

				expect(component.get('.form-load-failure-dialog').isVisible()).toBe(true);
			}
		);

		it('presents an error message when failing to load a form with a computation containing an XPath syntax error', async () => {
			const xpathSyntaxErrorFormXML = await getWebFormsTestFixture('xpath-syntax-error.xml');
			const component = mountComponent(xpathSyntaxErrorFormXML);

			await flushPromises();

			expect(component.get('.form-load-failure-dialog').isVisible()).toBe(true);
		});

		// TODO: tests failure which is currently produced by throwing a string.
		// Checking the text content here is intended to ensure we are actually
		// presenting the message to a user.
		it('presents an error message when failing to load a form with a computation referencing an unknown XPath function', async () => {
			const xpathUnknownFunctionFormXML = await getWebFormsTestFixture(
				'xpath-unknown-function.xml'
			);
			const component = mountComponent(xpathUnknownFunctionFormXML);

			await flushPromises();

			const formLoadFailureDialog = component.get('.form-load-failure-dialog');

			expect(formLoadFailureDialog.isVisible()).toBe(true);

			const message = formLoadFailureDialog.get('.message');

			expect(message.text()).toMatch(/\bnope\b/);
		});
	});

	describe('editing', () => {
		/**
		 * @todo It would be nice to use the same XForms fixture DSL we use in
		 * other projects, but for reasons having to do with Vue/tooling, it
		 * cannot presently be imported in this package's tests.
		 *
		 * It **can import at runtime**, and fixtures built with it do work! But
		 * doing so causes a TypeScript error, because the module's directory path
		 * is excluded in `tsconfig.vitest.json`. That exclusion prevents totally
		 * unrelated errors in `@getodk/common`. Because Vue is special. This is
		 * all solvable... just, not now.
		 */
		const editBasicForm = /* xml */ `<?xml version="1.0"?>
		<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml"
			xmlns:jr="http://openrosa.org/javarosa" xmlns:odk="http://www.opendatakit.org/xforms"
			xmlns:orx="http://openrosa.org/xforms">
			<h:head>
				<h:title>Edit (basic)</h:title>
				<model>
					<instance>
						<data id="edit-basic">
							<a />
						</data>
					</instance>
					<bind nodeset="/data/a" type="string" />
				</model>
			</h:head>
			<h:body>
				<input ref="/data/a" />
			</h:body>
		</h:html>`;

		it('loads edited instance state', async () => {
			const previouslySubmittedValue = 'submitted previously';

			/** @see {@link editBasicForm} */
			const instanceXML = /* xml */ `<data id="edit-basic">
				<a>${previouslySubmittedValue}</a>
			</data>`;

			const component = mountComponent(editBasicForm, {
				overrideProps: {
					editInstance: {
						resolveInstance: () => instanceXML,
						attachmentFileNames: [],
						resolveAttachment: () => {
							throw new Error("This form has no attachments, and we can't edit them yet anyway!");
						},
					},
				},
			});

			await flushPromises();

			const textInputElement = component.get<HTMLInputElement>('input.p-inputtext').element;

			expect(textInputElement.value).toBe(previouslySubmittedValue);
		});

		it.fails('loads instance attachments for editing', async () => {
			/** @see {@link editBasicForm} */
			const editAttachmentsForm = /* xml */ `<?xml version="1.0"?>
			<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml"
				xmlns:jr="http://openrosa.org/javarosa" xmlns:odk="http://www.opendatakit.org/xforms"
				xmlns:orx="http://openrosa.org/xforms">
				<h:head>
					<h:title>Edit attachments</h:title>
					<model>
						<instance>
							<data id="edit-attachments">
								<a />
							</data>
						</instance>
						<bind nodeset="/data/a" type="binary" />
					</model>
				</h:head>
				<h:body>
					<upload ref="/data/a" mediatype="image/" />
				</h:body>
			</h:html>`;

			/** @see {@link https://stackoverflow.com/a/13139830} */
			const imageURL =
				'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
			const imageFileName = 'smol.gif';

			const fetchImage = () => fetch(imageURL);
			const fetchedImage = await fetchImage();

			expect(fetchedImage.ok).toBe(true);

			const attachments: ResolvableInstanceAttachmentsMap = new Map([[imageFileName, fetchImage]]);

			/** @see {@link editBasicForm} */
			const instanceXML = /* xml */ `<data id="edit-attachments">
				<a>${imageFileName}</a>
			</data>`;

			const component = mountComponent(editAttachmentsForm, {
				overrideProps: {
					editInstance: {
						resolveInstance: () => instanceXML,
						attachmentFileNames: [imageFileName],
						resolveAttachment: async (fileName: string) => {
							const resolve = attachments.get(fileName);

							if (resolve == null) {
								return new Response(null, { status: 404 });
							}

							return resolve();
						},
					},
				},
			});

			await flushPromises();

			// Temporary assertion: we know that providing any instance attachments
			// will produce an error until support for `<upload>` is implemented.
			expect(component.get('.form-load-failure-dialog').isVisible()).toBe(false);

			// TODO: actual test logic beyond this point will depend on implementation
			// of `<upload>` controls.
		});
	});
});
