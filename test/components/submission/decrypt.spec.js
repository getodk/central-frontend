import sinon from 'sinon';

import SubmissionDownload from '../../../src/components/submission/decrypt.vue';

import useFields from '../../../src/request-data/fields';
import { noop } from '../../../src/util/util';
import { useRequestData } from '../../../src/request-data';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { loadSubmissionList } from '../../util/submission';
import { mergeMountOptions, mount, withSetup } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { relativeUrl } from '../../util/request';
import { testRequestData } from '../../util/request-data';
import { waitUntil } from '../../util/util';

const mountComponent = (options = undefined) => {
  // First, merge mount options in order to get the test data associated with
  // the formVersion prop.
  const merged = mergeMountOptions(options, {
    props: { state: true, formVersion: testData.extendedForms.last() }
  });

  // Next, use that test data to set requestData.
  if (merged.container == null) merged.container = {};
  const { props } = merged;
  merged.container.requestData = testRequestData(['keys', useFields], {
    [props.formVersion.publishedAt != null ? 'form' : 'formDraft']: props.formVersion,
    fields: props.formVersion._fields,
    keys: testData.standardKeys.sorted()
  });

  // Now, use requestData to set the formVersion prop to a resource or resource
  // view rather than to test data.
  merged.container = createTestContainer(merged.container);
  props.formVersion = props.formVersion.publishedAt != null
    ? merged.container.requestData.form
    : withSetup(
      () => {
        const { resourceView } = useRequestData();
        return resourceView('formDraft', (data) => data.get());
      },
      { container: merged.container }
    );

  return mount(SubmissionDownload, merged);
};

const aUrl = (a) => relativeUrl(a.attributes().href);

describe('SubmissionDownload', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () => {
    testData.extendedForms.createPast(1);
    return loadSubmissionList().testModalToggles({
      modal: SubmissionDownload,
      show: '#submission-download-button',
      hide: '.modal-actions .btn'
    });
  });

  describe('splitSelectMultiples checkbox', () => {
    it('enables the checkbox if the form has a select_multiple field', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.selectMultiple('/sm')]
      });
      const checkbox = mountComponent().get('.checkbox');
      checkbox.classes('disabled').should.be.false();
      checkbox.get('input').element.disabled.should.be.false();
      should.not.exist(checkbox.get('label').attributes().title);
    });

    it('disables checkbox if form does not have a select_multiple field', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.int('/i')]
      });
      const checkbox = mountComponent().get('.checkbox');
      checkbox.classes('disabled').should.be.true();
      checkbox.get('input').element.disabled.should.be.true();
      const { title } = checkbox.get('label').attributes();
      title.should.equal('This Form does not have any select multiple fields.');
    });

    it('disables the checkbox if the form is encrypted', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.selectMultiple('/sm')],
        key: testData.standardKeys.createPast(1, { managed: false }).last()
      });
      const checkbox = mountComponent().get('.checkbox');
      checkbox.classes('disabled').should.be.true();
      checkbox.get('input').element.disabled.should.be.true();
      const { title } = checkbox.get('label').attributes();
      title.should.equal('Encrypted Forms cannot be processed in this way.');
    });

    it('includes splitSelectMultiples in each download link', async () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.selectMultiple('/sm')]
      });
      const modal = mountComponent();
      const a = modal.findAll('a');
      for (const url of a.map(aUrl))
        url.searchParams.get('splitSelectMultiples').should.equal('false');
      await modal.get('input[type="checkbox"]').setChecked();
      for (const url of a.map(aUrl))
        url.searchParams.get('splitSelectMultiples').should.equal('true');
    });
  });

  it('includes groupPaths in each download link', async () => {
    testData.extendedForms.createPast(1);
    const modal = mountComponent();
    const a = modal.findAll('a');
    for (const url of a.map(aUrl))
      url.searchParams.get('groupPaths').should.equal('true');
    await modal.findAll('input[type="checkbox"]')[1].setChecked();
    for (const url of a.map(aUrl))
      url.searchParams.get('groupPaths').should.equal('false');
  });

  describe('deletedFields checkbox', () => {
    it('includes deletedFields in each download link', async () => {
      testData.extendedForms.createPast(1);
      const modal = mountComponent();
      const a = modal.findAll('a');
      for (const url of a.map(aUrl))
        url.searchParams.get('deletedFields').should.equal('false');
      await modal.findAll('input[type="checkbox"]')[2].setChecked();
      for (const url of a.map(aUrl))
        url.searchParams.get('deletedFields').should.equal('true');
    });

    it('disables the checkbox for a form draft', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      const modal = mountComponent({
        props: { formVersion: testData.extendedFormDrafts.last() }
      });
      const checkbox = modal.findAll('.checkbox')[2];
      checkbox.classes('disabled').should.be.true();
      checkbox.get('input').element.disabled.should.be.true();
      const { title } = checkbox.get('label').attributes();
      title.should.equal('Draft Forms cannot be processed in this way.');
    });
  });

  describe('input focus', () => {
    it('focuses the splitSelectMultiples checkbox if it is enabled', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.selectMultiple('/sm')]
      });
      const modal = mountComponent({ attachTo: document.body });
      modal.get('input').should.be.focused();
    });

    it('focuses groupPaths checkbox if splitSelectMultiples checkbox is disabled', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.int('/i')]
      });
      const modal = mountComponent({ attachTo: document.body });
      modal.findAll('input')[1].should.be.focused();
    });
  });

  describe('passphrase input', () => {
    it('shows the input if there is a managed key', () => {
      testData.extendedForms.createPast(1, {
        key: testData.standardKeys.createPast(1, { managed: true }).last()
      });
      const modal = mountComponent();
      modal.find('input[type="password"]').exists().should.be.true();
    });

    it('does not show the input if there is not a key', () => {
      testData.extendedForms.createPast(1);
      const modal = mountComponent();
      modal.find('input[type="password"]').exists().should.be.false();
    });

    it('does not show input if there is a key that is not a managed key', () => {
      testData.extendedForms.createPast(1, {
        key: testData.standardKeys.createPast(1, { managed: false }).last()
      });
      const modal = mountComponent();
      modal.find('input[type="password"]').exists().should.be.false();
    });

    it('shows a hint if there is one', () => {
      testData.extendedForms.createPast(1, {
        key: testData.standardKeys
          .createPast(1, { managed: true, hint: 'some hint' })
          .last()
      });
      const text = mountComponent().get('.form-group + p').text();
      text.should.equal('Hint: some hint');
    });
  });

  it('resets only the passphrase input after the modal is hidden', async () => {
    testData.extendedForms.createPast(1, {
      fields: [testData.fields.selectMultiple('/sm')],
      key: testData.standardKeys.createPast(1, { managed: true }).last()
    });
    const modal = mountComponent();
    const checkboxes = modal.findAll('input[type="checkbox"]');
    for (const checkbox of checkboxes)
      await checkbox.setChecked(); // eslint-disable-line no-await-in-loop
    const passphrase = modal.get('input[type="password"]');
    await passphrase.setValue('supersecret');
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    for (const checkbox of checkboxes)
      checkbox.element.checked.should.be.true();
    passphrase.element.value.should.equal('');
  });

  describe('href attributes', () => {
    it('sets the correct href attributes for a form', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
      const urls = mountComponent().findAll('a').map(aUrl);
      urls[0].pathname.should.equal('/v1/projects/1/forms/a%20b/submissions.csv');
      urls[1].pathname.should.equal('/v1/projects/1/forms/a%20b/submissions.csv.zip');
      urls[1].searchParams.get('attachments').should.equal('false');
      urls[2].pathname.should.equal('/v1/projects/1/forms/a%20b/submissions.csv.zip');
      urls[2].searchParams.has('attachments').should.be.false();
    });

    it('sets the correct href attributes for a form draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
      const modal = mountComponent({
        props: { formVersion: testData.extendedFormDrafts.last() }
      });
      const urls = modal.findAll('a').map(aUrl);
      urls[0].pathname.should.equal('/v1/projects/1/forms/a%20b/draft/submissions.csv');
      urls[1].pathname.should.equal('/v1/projects/1/forms/a%20b/draft/submissions.csv.zip');
      urls[1].searchParams.get('attachments').should.equal('false');
      urls[2].pathname.should.equal('/v1/projects/1/forms/a%20b/draft/submissions.csv.zip');
      urls[2].searchParams.has('attachments').should.be.false();
    });
  });

  it('includes the OData filter in each download link', () => {
    testData.extendedForms.createPast(1);
    const modal = mountComponent({
      props: { odataFilter: '__system/submitterId eq 1' }
    });
    for (const url of modal.findAll('a').map(aUrl))
      url.searchParams.get('$filter').should.equal('__system/submitterId eq 1');
  });

  describe('download link for all data tables', () => {
    it('enables the link if the form has a repeat group', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.repeat('/r'), testData.fields.int('/r/i')]
      });
      const modal = mountComponent();
      const action = modal.findAll('.submission-download-action')[1];
      action.classes('disabled').should.be.false();
      const label = action.get('.submission-download-action-label');
      should.not.exist(label.attributes().title);
      const a = action.get('a');
      a.classes('disabled').should.be.false();
      should.not.exist(a.attributes().title);
    });

    it('disables the link if the form does not have a repeat group', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.int('/i')]
      });
      const modal = mountComponent();
      const action = modal.findAll('.submission-download-action')[1];
      action.classes('disabled').should.be.true();
      const label = action.get('.submission-download-action-label');
      label.attributes().title.should.equal('This Form does not have repeats.');
      const a = action.get('a');
      a.classes('disabled').should.be.true();
      a.attributes().title.should.equal('This Form does not have repeats.');
    });
  });

  describe('clicking a link if there is not a managed key', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1, {
        // Create a form without a repeat group.
        fields: [testData.fields.int('/i')]
      });
    });

    it('does not prevent default', async () => {
      const modal = mountComponent();
      let defaultPrevented;
      modal.element.addEventListener('click', (event) => {
        defaultPrevented = event.defaultPrevented;
        event.preventDefault();
      });
      modal.get('a').trigger('click');
      defaultPrevented.should.be.false();
    });

    it('shows an info alert', async () => {
      const modal = mountComponent();
      modal.element.addEventListener('click', (event) => {
        event.preventDefault();
      });
      modal.get('a').trigger('click');
      modal.should.alert('info');
    });

    it('does nothing if the link is disabled', () => {
      const modal = mountComponent();
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      modal.findAll('a')[1].element.dispatchEvent(event).should.be.false();
      modal.should.not.alert();
    });
  });

  describe('clicking a link if there is a managed key', () => {
    const preventDefault = (event) => { event.preventDefault(); };
    const waitForIframe = async (iframe, path) => {
      await waitUntil(() => iframe.contentWindow.location.pathname === path);
      return waitUntil(() =>
        iframe.contentWindow.document.readyState !== 'loading');
    };
    /* In production, it seems that the iframe changes pages if a Problem is
    returned after the form is submitted, but it does not change pages if the
    submission is successful. However, in testing, the iframe always seems to
    change pages after the form is submitted. Because of that, each test should
    specify what should happen after the form is submitted. Many tests will
    prevent default in order to prevent a page change, simulating a successful
    submission. */
    const setup = async (onSubmit = preventDefault) => {
      testData.extendedForms.createPast(1, {
        // Create a form without a repeat group.
        fields: [testData.fields.int('/i')],
        key: testData.standardKeys.createPast(1, { managed: true }).last()
      });
      const modal = mountComponent({ attachTo: document.body });
      await modal.get('input[type="password"]').setValue('supersecret');
      const iframe = modal.get('iframe').element;
      await waitForIframe(iframe, '/blank.html');

      /* We want to test things about the form submission by listening for a
      submit event. Yet the component calls the form submit() method, which
      doesn't trigger a submit event. Because of that, when submit() is called
      on the form, the test calls requestSubmit() instead. The only difference
      between submit() and requestSubmit() here is that requestSubmit() will
      trigger a submit event. We considered having the component itself call
      requestSubmit() instead of submit(). However, Safari doesn't support
      requestSubmit() yet. We also encountered this Firefox bug:
      https://bugzilla.mozilla.org/show_bug.cgi?id=1306686 */
      const { contentWindow } = iframe;
      contentWindow.document.addEventListener('submit', onSubmit);
      (contentWindow.HTMLFormElement.prototype === HTMLFormElement.prototype).should.be.false();
      const originalSubmit = contentWindow.HTMLFormElement.prototype.submit;
      contentWindow.HTMLFormElement.prototype.submit = function submit() {
        // Immediately restore the submit() method in case it is used
        // internally.
        contentWindow.HTMLFormElement.prototype.submit = originalSubmit;
        this.requestSubmit();
      };

      return modal;
    };

    it('prevents default for the click event', async () => {
      const modal = await setup();
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      modal.get('a').element.dispatchEvent(event).should.be.false();
    });

    it('submits a form from the iframe', async () => {
      let success = false;
      const modal = await setup(event => {
        event.preventDefault();
        const action = event.target.getAttribute('action');
        action.should.startWith('/v1/projects/1/forms/f/submissions.csv?');
        const inputs = event.target.querySelectorAll('input');
        inputs.length.should.equal(2);
        const key = testData.standardKeys.last();
        inputs[0].getAttribute('name').should.equal(key.id.toString());
        inputs[0].value.should.equal('supersecret');
        inputs[1].value.should.equal(modal.vm.session.csrf);
        success = true;
      });
      modal.get('a').trigger('click');
      success.should.be.true();
    });

    it('resets the iframe form after it is submitted', async () => {
      const modal = await setup();
      modal.get('a').trigger('click');
      const doc = modal.vm.$refs.iframe.contentWindow.document;
      const inputs = doc.querySelectorAll('input');
      inputs.length.should.equal(2);
      inputs[0].value.should.equal('');
      inputs[1].value.should.equal('');
    });

    it('submits the iframe form if the click is on the icon', async () => {
      const onSubmit = sinon.fake(preventDefault);
      const modal = await setup(onSubmit);
      modal.get('a span').trigger('click');
      onSubmit.called.should.be.true();
    });

    it('shows an info alert', async () => {
      const modal = await setup();
      modal.get('a').trigger('click');
      modal.should.alert('info');
    });

    it('does nothing if the link is disabled', async () => {
      const onSubmit = sinon.fake();
      const modal = await setup(onSubmit);
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      modal.findAll('a')[1].element.dispatchEvent(event).should.be.false();
      onSubmit.called.should.be.false();
      modal.should.not.alert();
    });

    it('does nothing if the passphrase is empty', async () => {
      const onSubmit = sinon.fake();
      const modal = await setup(onSubmit);
      await modal.get('input[type="password"]').setValue('');
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      modal.get('a').element.dispatchEvent(event).should.be.false();
      onSubmit.called.should.be.false();
      modal.should.not.alert();
    });

    it('shows a danger alert if a Problem is returned', async () => {
      const clock = sinon.useFakeTimers(Date.now());
      const modal = await setup(noop);
      const a = modal.get('a');
      a.element.setAttribute('href', '/test/files/problem.html');
      a.trigger('click');
      const iframe = modal.get('iframe').element;
      await waitForIframe(iframe, '/test/files/problem.html');
      clock.tick(1000);
      modal.should.alert(
        'danger',
        'An unknown internal problem has occurred. Please try again later.'
      );
    });

    describe('error response that is not a Problem', () => {
      it('shows a danger alert', async () => {
        const clock = sinon.useFakeTimers(Date.now());
        const modal = await setup(event => {
          event.preventDefault();
          const { body } = event.target.getRootNode();
          body.textContent = '500 Internal Server Error';
        });
        modal.get('a').trigger('click');
        clock.tick(1000);
        modal.should.alert('danger', 'Something went wrong while requesting your data.');
      });

      it('logs the response', async () => {
        const clock = sinon.useFakeTimers(Date.now());
        const modal = await setup(event => {
          event.preventDefault();
          const { body } = event.target.getRootNode();
          body.textContent = '500 Internal Server Error';
        });
        modal.get('a').trigger('click');
        clock.tick(1000);
        const { logger } = modal.vm.$container;
        logger.log.calledWith('500 Internal Server Error').should.be.true();
      });
    });

    it('continually checks for an error response', async () => {
      const clock = sinon.useFakeTimers(Date.now());
      const modal = await setup();
      const checkForProblem = sinon.spy(modal.vm, 'checkForProblem');
      modal.get('a').trigger('click');
      clock.tick(1000);
      checkForProblem.callCount.should.equal(1);
      // Calling tickAsync() rather than tick() so that the callWait promise
      // will resolve.
      await clock.tickAsync(1000);
      checkForProblem.callCount.should.equal(2);
    });
  });
});
