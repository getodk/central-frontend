import type { OdkWebFormsProps } from '@getodk/web-forms/components/OdkWebForm.vue';
import OdkWebForm from '@getodk/web-forms/components/OdkWebForm.vue';
import { waitAllTasksToFinish } from '@getodk/web-forms/lib/async/event-loop.ts';
import { POST_SUBMIT__NEW_INSTANCE } from '@getodk/web-forms/lib/constants/control-flow.ts';
import { findFocusTarget } from '@getodk/web-forms/lib/useNavigationTarget.ts';
import type {
  HostSubmissionResult,
  HostSubmissionResultCallback,
  OptionalAwaitableHostSubmissionResult,
} from '@getodk/web-forms/lib/submission/host-submission-result-callback.ts';
import type {
  MonolithicInstancePayload,
  ResolvableInstanceAttachmentsMap,
} from '@getodk/xforms-engine';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import packageJson from '../../package.json' with { type: 'json' };
import {
  getButtonByText,
  getFormXml,
  getWebFormsTestFixture,
  globalMountOptions,
} from '../helpers';

interface MountComponentOptions {
  readonly overrideProps?: Partial<OdkWebFormsProps>;
  readonly onSubmit?: (
    payload: MonolithicInstancePayload,
    callback: HostSubmissionResultCallback
  ) => void;
}

describe('OdkWebForm', () => {
  let formXML: string;
  const TOP_ERROR_BANNER = '.form-error-message';

  const mountComponent = (xml: string, options?: MountComponentOptions) => {
    const component = mount(OdkWebForm, {
      props: {
        formXml: xml,
        fetchFormAttachment: () => {
          throw new Error('Not exercised here');
        },
        onSubmit: options?.onSubmit,

        ...options?.overrideProps,
      },
      global: globalMountOptions,
      attachTo: document.body,
    });

    return component;
  };

  type FormWrapper = ReturnType<typeof mountComponent>;

  const answerCurrentQuestion = (component: FormWrapper, value: string) => {
    return component.get('input.p-inputtext').setValue(value);
  };

  const expectQuestionHighlight = (component: FormWrapper, highlighted: boolean) => {
    expect(component.get('.question-container').classes().includes('highlight')).toBe(highlighted);
  };

  const expectErrorBanner = (component: FormWrapper, message: string | null) => {
    if (message === null) {
      expect(component.find(TOP_ERROR_BANNER).exists()).toBe(false);
      return;
    }
    expect(component.get(TOP_ERROR_BANNER).text()).toContain(message);
  };

  const clickNext = (component: FormWrapper) => {
    return getButtonByText(component, 'Next').trigger('click');
  };

  const clickBack = (component: FormWrapper) => {
    return getButtonByText(component, 'Back').trigger('click');
  };

  const expectOnPage = (component: FormWrapper, label: string) => {
    expect(component.text()).toContain(label);
  };

  beforeEach(async () => {
    formXML = await getFormXml('2-simple-required.xml');

    if ('scrollTo' in HTMLElement.prototype) {
      const mock = vi.spyOn<HTMLElement, 'scrollTo'>(HTMLElement.prototype, 'scrollTo');
      return mock.mockImplementation(function () {
        // Do nothing
      });
    } else {
      const mock = vi.fn(function () {
        // Do nothing
      });
      // eslint-disable-next-line @typescript-eslint/dot-notation
      HTMLElement.prototype['scrollTo'] = mock as never;
    }

    if ('showPopover' in HTMLElement.prototype) {
      const mock = vi.spyOn<HTMLElement, 'showPopover'>(HTMLElement.prototype, 'showPopover');
      return mock.mockImplementation(function (this: HTMLElement) {
        this.style.display = 'block';
      });
    } else {
      const mock = vi.fn(function (this: HTMLElement) {
        this.style.display = 'block';
      });
      // eslint-disable-next-line @typescript-eslint/dot-notation
      HTMLElement.prototype['showPopover'] = mock as never;
    }

    if ('hidePopover' in HTMLElement.prototype) {
      const mock = vi.spyOn<HTMLElement, 'hidePopover'>(HTMLElement.prototype, 'hidePopover');
      return mock.mockImplementation(function (this: HTMLElement) {
        this.style.display = 'none';
      });
    } else {
      const mock = vi.fn(function (this: HTMLElement) {
        this.style.display = 'none';
      });
      // eslint-disable-next-line @typescript-eslint/dot-notation
      HTMLElement.prototype['hidePopover'] = mock as never;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows validation banner and highlights on submit and hide once valid value(s) are set', async () => {
    const component = mountComponent(formXML);
    await flushPromises();

    expectErrorBanner(component, null);
    expectQuestionHighlight(component, false);

    await getButtonByText(component, 'Send').trigger('click');

    expectErrorBanner(component, '1 question with error');
    expectQuestionHighlight(component, true);

    // Enter text to make question valid
    await answerCurrentQuestion(component, 'ok');

    expectErrorBanner(component, null);
    expectQuestionHighlight(component, false);
  });

  it('shows validation banner and highlights again if any question becomes invalid again', async () => {
    const component = mountComponent(formXML);
    await flushPromises();

    expectErrorBanner(component, null);
    expectQuestionHighlight(component, false);

    await getButtonByText(component, 'Send').trigger('click');

    expectErrorBanner(component, '1 question with error');
    expectQuestionHighlight(component, true);

    // Enter text to make question valid
    await answerCurrentQuestion(component, 'ok');

    expectErrorBanner(component, null);
    expectQuestionHighlight(component, false);

    // Empty the textbox to make it invalid again
    await answerCurrentQuestion(component, '');

    expectErrorBanner(component, '1 question with error');
    expectQuestionHighlight(component, true);
  });

  it('shows Web Forms version number in "Powered by" section', async () => {
    const component = mountComponent(formXML);
    await flushPromises();

    const displayedVersion = component.find('.powered-by-wrapper .version');

    expect(/^v\d+\.\d+\.\d+$/.test(displayedVersion.text())).toBeTruthy();
    expect(displayedVersion.text()).toEqual(`v${packageJson.version}`);
  });

  describe('invalid questions block navigation to the next page', () => {
    const mountPagedForm = async () => {
      const component = mountComponent(await getFormXml('pagination-19-required.xml'));
      await flushPromises();
      return component;
    };

    it('stays on the page and shows the error when Next is pressed on a blank required question', async () => {
      const component = await mountPagedForm();

      expectOnPage(component, 'What is your name?');
      expectErrorBanner(component, null);
      expectQuestionHighlight(component, false);

      await clickNext(component);

      expectOnPage(component, 'What is your name?');
      expect(component.text()).not.toContain('What is your age?');
      // Only the blocked question is counted, not untouched blank ones on later pages
      expectErrorBanner(component, '1 question with error');
      expectQuestionHighlight(component, true);
    });

    it('advances once the required question is answered, hiding the banner when its error is fixed', async () => {
      const component = await mountPagedForm();

      await clickNext(component);
      expectErrorBanner(component, '1 question with error');

      await answerCurrentQuestion(component, 'Ada');
      expectErrorBanner(component, null);

      await clickNext(component);

      expectOnPage(component, 'What is your age?');
      expectQuestionHighlight(component, false);

      await clickNext(component);
      expectErrorBanner(component, '1 question with error');
    });

    it('never blocks the Back button, and going back keeps the banner up', async () => {
      const component = await mountPagedForm();

      await answerCurrentQuestion(component, 'Ada');
      await clickNext(component);
      expectOnPage(component, 'What is your age?');

      await clickNext(component);
      expectErrorBanner(component, '1 question with error');

      await clickBack(component);

      expectOnPage(component, 'What is your name?');
      expectErrorBanner(component, '1 question with error');
    });

    it('keeps the error highlight when navigating away and back', async () => {
      const component = await mountPagedForm();

      await answerCurrentQuestion(component, 'Ada');
      await clickNext(component);

      // Answer then clear, so the age question is touched and invalid
      await answerCurrentQuestion(component, '52');
      await answerCurrentQuestion(component, '');
      expectQuestionHighlight(component, true);

      await clickBack(component);
      await clickNext(component);

      expectOnPage(component, 'What is your age?');
      expectQuestionHighlight(component, true);
    });
  });

  describe('form load failure', () => {
    // TODO: this test uses a fixture which currently causes engine-internal
    // reactivity (Solid) to produce a "potential infinite loop" error.
    // Triggering this error is slow: detection uses a heuristic of a hard limit
    // on the reactive call stack depth. When we reintroduce cycle detection in
    // the future, we will probably want to remove this timeout option!
    it(
      'presents an error message when failing to load a form with a cyclic computation',
      { timeout: 8 * 1000 },
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

  describe('submission control flow', () => {
    const initialInputValue = 'initial input value';
    const firstSubmissionInputValue = 'first submission input value';

    type AssignedInputValue = typeof firstSubmissionInputValue | typeof initialInputValue;

    /**
     * @todo As noted in top-level fixture for editing
     */
    const resetStateForm = /* xml */ `<?xml version="1.0"?>
		<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml"
			xmlns:jr="http://openrosa.org/javarosa" xmlns:odk="http://www.opendatakit.org/xforms"
			xmlns:orx="http://openrosa.org/xforms">
			<h:head>
				<h:title>Edit (basic)</h:title>
				<model>
					<instance>
						<data id="edit-basic">
							<a>${initialInputValue}</a>
						</data>
					</instance>
					<bind nodeset="/data/a" type="string" />
				</model>
			</h:head>
			<h:body>
				<input ref="/data/a" />
			</h:body>
		</h:html>`;

    let submittedPayload: MonolithicInstancePayload | null = null;
    let syncResetResult: HostSubmissionResult;
    let asyncResetResult: Promise<HostSubmissionResult>;

    beforeEach(() => {
      submittedPayload = null;
      syncResetResult = { next: POST_SUBMIT__NEW_INSTANCE };
      asyncResetResult = Promise.resolve(syncResetResult);
    });

    type HostSubmissionHandler = (
      payload: MonolithicInstancePayload
    ) => OptionalAwaitableHostSubmissionResult;

    const postSubmissionResetHandler = (
      payload: MonolithicInstancePayload
    ): HostSubmissionResult => {
      submittedPayload = payload;

      return syncResetResult;
    };

    const asyncPostSubmissionResetHandler = (
      payload: MonolithicInstancePayload
    ): Promise<HostSubmissionResult> => {
      submittedPayload = payload;

      return asyncResetResult;
    };

    const postSubmissionNoopHandler = (payload: MonolithicInstancePayload) => {
      submittedPayload = payload;
    };

    const asyncPostSubmissionNoopHandler = (payload: MonolithicInstancePayload) => {
      submittedPayload = payload;

      return Promise.resolve(null);
    };

    interface SubmissionHandlerCase {
      readonly description: string;
      readonly hostSubmissonHandler: HostSubmissionHandler | null;
      readonly expectedPostSubmissionValue: AssignedInputValue;
    }

    it.each<SubmissionHandlerCase>([
      {
        description: 'resets form state after submission (sync host result)',
        hostSubmissonHandler: postSubmissionResetHandler,
        expectedPostSubmissionValue: initialInputValue,
      },
      {
        description: 'resets form state after submission (async host result)',
        hostSubmissonHandler: asyncPostSubmissionResetHandler,
        expectedPostSubmissionValue: initialInputValue,
      },
      {
        description: 'does not reset form state by default (sync callback)',
        hostSubmissonHandler: postSubmissionNoopHandler,
        expectedPostSubmissionValue: firstSubmissionInputValue,
      },
      {
        description: 'does not reset form state by default (async callback)',
        hostSubmissonHandler: asyncPostSubmissionNoopHandler,
        expectedPostSubmissionValue: firstSubmissionInputValue,
      },

      // EVERYTHING is optional. This case ensures that introducing the callback
      // as a second parameter doesn't introduce regressions in a host
      // integration which only uses the first parameter.
      {
        description: 'does not reset form state by default (no callback)',
        hostSubmissonHandler: null,
        expectedPostSubmissionValue: firstSubmissionInputValue,
      },
    ])('$description', async ({ hostSubmissonHandler, expectedPostSubmissionValue }) => {
      const component = mountComponent(resetStateForm, {
        onSubmit: (payload, callback) => {
          if (hostSubmissonHandler != null) {
            callback(hostSubmissonHandler(payload));
          }
        },
      });

      await waitAllTasksToFinish();

      let textInput = component.get<HTMLInputElement>('input.p-inputtext');

      expect(textInput.element.value).toBe(initialInputValue);

      await textInput.setValue(firstSubmissionInputValue);

      // Click submit
      await getButtonByText(component, 'Send').trigger('click');
      await waitAllTasksToFinish();

      // Check either:
      //
      // - If "host" provides no submission handler, then no submission handler implementation could cause a side-effect (assignment of the payload it was passed to `submittedPayload`)
      // - If "host" does provide a submission handler, we've called it in the submit event handler.
      if (hostSubmissonHandler == null) {
        expect(submittedPayload).toBeNull();
      } else {
        expect(submittedPayload).not.toBeNull();
      }

      textInput = component.get<HTMLInputElement>('input.p-inputtext');

      // Check that Web Forms has performed the expected post-submit side effect
      // (if one is expected)
      expect(textInput.element.value).toBe(expectedPostSubmissionValue);
    });
  });

  describe('datepicker focus', () => {
    const requiredDateForm = /* xml */ `<?xml version="1.0"?>
		<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml">
			<h:head>
				<h:title>Required date</h:title>
				<model>
					<instance>
						<data id="required-date"><birthday /></data>
					</instance>
					<bind nodeset="/data/birthday" type="date" required="true()" />
				</model>
			</h:head>
			<h:body>
				<input ref="/data/birthday">
					<label>Birthday</label>
				</input>
			</h:body>
		</h:html>`;

    it('focuses the datepicker input when navigating to its validation error', async () => {
      const component = mountComponent(requiredDateForm);
      await flushPromises();

      await getButtonByText(component, 'Send').trigger('click');
      await waitAllTasksToFinish();

      expect(component.get('.question-container').text()).toContain('This field is required.');
      expect(document.activeElement).toBe(component.get('.question-container input').element);
    });

    it('targets the question container instead of the datepicker input when there is no validation error', async () => {
      const component = mountComponent(requiredDateForm);
      await flushPromises();

      const container = component.get<HTMLElement>('.question-container').element;
      expect(findFocusTarget(null, container)).toBe(container);
    });
  });
});
