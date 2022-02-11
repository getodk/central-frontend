import sinon from 'sinon';

import SubmissionDownload from '../../../src/components/submission/decrypt.vue';

import testData from '../../data';
import { loadSubmissionList } from '../../util/submission';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { wait } from '../../util/util';

const mountComponent = (options = {}) => {
  const propsData = {
    state: true,
    formVersion: testData.extendedForms.last(),
    ...options.propsData
  };
  return mount(SubmissionDownload, {
    ...options,
    propsData,
    requestData: {
      fields: propsData.formVersion._fields,
      keys: testData.standardKeys.sorted()
    }
  });
};

const aUrl = (a) => {
  const { href } = a.attributes();
  href.should.startWith('/');
  return new URL(href, window.location.origin);
};

describe.only('SubmissionDownload', () => {
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
      const a = modal.findAll('a').wrappers;
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
    const a = modal.findAll('a').wrappers;
    for (const url of a.map(aUrl))
      url.searchParams.get('groupPaths').should.equal('true');
    await modal.findAll('input[type="checkbox"]').at(1).setChecked();
    for (const url of a.map(aUrl))
      url.searchParams.get('groupPaths').should.equal('false');
  });

  describe('includes deletedFields in each download link', async () => {
    testData.extendedForms.createPast(1);
    const modal = mountComponent();
    const a = modal.findAll('a').wrappers;
    for (const url of a.map(aUrl))
      url.searchParams.get('deletedFields').should.equal('false');
    await modal.findAll('input[type="checkbox"]').at(2).setChecked();
    for (const url of a.map(aUrl))
      url.searchParams.get('deletedFields').should.equal('true');
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
      modal.findAll('input').at(1).should.be.focused();
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

    it('does not show the input if there is not a managed key', () => {
      testData.extendedForms.createPast(1);
      const modal = mountComponent();
      modal.find('input[type="password"]').exists().should.be.false();
    });

    it('does not show input for an encrypted form if there is not a managed key', () => {
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
    const checkboxes = modal.findAll('input[type="checkbox"]').wrappers;
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
      const urls = mountComponent().findAll('a').wrappers.map(aUrl);
      urls[0].pathname.should.equal('/v1/projects/1/forms/a%20b/submissions.csv');
      urls[1].pathname.should.equal('/v1/projects/1/forms/a%20b/submissions.csv.zip');
      urls[1].searchParams.get('attachments').should.equal('false');
      urls[2].pathname.should.equal('/v1/projects/1/forms/a%20b/submissions.csv.zip');
      urls[2].searchParams.has('attachments').should.be.false();
    });

    it('sets the correct href attributes for a form draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
      const modal = mountComponent({
        propsData: { formVersion: testData.extendedFormDrafts.last() }
      });
      const urls = modal.findAll('a').wrappers.map(aUrl);
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
      propsData: { odataFilter: '__system/submitterId eq 1' }
    });
    for (const url of modal.findAll('a').wrappers.map(aUrl))
      url.searchParams.get('$filter').should.equal('__system/submitterId eq 1');
  });

  describe('download link for all data tables', () => {
    it('enables the link if the form has a repeat group', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.repeat('/r'), testData.fields.int('/i')]
      });
      const modal = mountComponent();
      const action = modal.findAll('.submission-download-action').at(1);
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
      const action = modal.findAll('.submission-download-action').at(1);
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
      modal.element.addEventListener('click', event => {
        defaultPrevented = event.defaultPrevented;
        event.preventDefault();
      });
      await modal.get('a').trigger('click');
      defaultPrevented.should.be.false();
    });

    it('shows an info alert', async () => {
      testData.extendedForms.createPast(1);
      const modal = mountComponent();
      modal.element.addEventListener('click', (event) => {
        event.preventDefault();
      });
      await modal.get('a').trigger('click');
      modal.should.alert('info');
    });

    it('does nothing if the link is disabled', () => {
      const modal = mountComponent();
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      modal.findAll('a').at(1).element.dispatchEvent(event).should.be.false();
      modal.should.not.alert();
    });
  });

  describe('clicking a link if there is a managed key', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1, {
        // Create a form without a repeat group.
        fields: [testData.fields.int('/i')],
        key: testData.standardKeys.createPast(1, { managed: true }).last()
      });
    });

    it('prevents default', async () => {
      const modal = mountComponent();
      await modal.get('input[type="password"]').setValue('supersecret');
      sinon.replace(modal.vm, 'decrypt', sinon.fake());
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      modal.get('a').element.dispatchEvent(event).should.be.false();
    });

    // Here, we simply test that the decrypt() method is called with the correct
    // argument. We test the actual behavior of the decrypt() method below.
    it('calls the decrypt() method', async () => {
      const modal = mountComponent();
      await modal.get('input[type="password"]').setValue('supersecret');
      const decrypt = sinon.fake();
      sinon.replace(modal.vm, 'decrypt', decrypt);
      const a = modal.get('a');
      await a.trigger('click');
      decrypt.calledWith(a.attributes().href).should.be.true();
    });

    it('calls the decrypt() method if the click is on the icon', async () => {
      const modal = mountComponent();
      await modal.get('input[type="password"]').setValue('supersecret');
      const decrypt = sinon.fake();
      sinon.replace(modal.vm, 'decrypt', decrypt);
      const a = modal.get('a');
      await a.get('span').trigger('click');
      decrypt.calledWith(a.attributes().href).should.be.true();
    });

    it('shows an info alert', async () => {
      const modal = mountComponent();
      await modal.get('input[type="password"]').setValue('supersecret');
      sinon.replace(modal.vm, 'decrypt', sinon.fake());
      await modal.get('a').trigger('click');
      modal.should.alert('info');
    });

    it('does nothing if the link is disabled', async () => {
      const modal = mountComponent();
      await modal.get('input[type="password"]').setValue('supersecret');
      const decrypt = sinon.fake();
      sinon.replace(modal.vm, 'decrypt', decrypt);
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      modal.findAll('a').at(1).element.dispatchEvent(event).should.be.false();
      decrypt.called.should.be.false();
      modal.should.not.alert();
    });

    it('does nothing if the passphrase has not been entered', () => {
      const modal = mountComponent();
      const decrypt = sinon.fake();
      sinon.replace(modal.vm, 'decrypt', decrypt);
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      modal.get('a').element.dispatchEvent(event).should.be.false();
      decrypt.called.should.be.false();
      modal.should.not.alert();
    });

    it('submits a form from the iframe', async () => {
      const modal = mountComponent({ attachTo: document.body });
      // Wait for the iframe to load.
      await wait(200);
      await modal.get('input[type="password"]').setValue('supersecret');
      let success = false;
      const doc = modal.vm.$refs.iframe.contentWindow.document;
      doc.body.addEventListener('submit', (event) => {
        const action = event.target.getAttribute('action');
        action.should.equal('/v1/projects/1/forms/f/submissions.csv.zip');

        const inputs = event.target.querySelectorAll('input');
        inputs.length.should.equal(2);
        const key = testData.standardKeys.last();
        inputs[0].getAttribute('name').should.equal(key.id.toString());
        inputs[0].value.should.equal('supersecret');
        inputs[1].value.should.equal(modal.vm.session.csrf);
        Promise.resolve().then(() => {
          inputs[0].value.should.equal('');
          inputs[1].value.should.equal('');
          success = true;
        });
      });
      modal.vm.decrypt('/v1/projects/1/forms/f/submissions.csv.zip');
      await modal.vm.$nextTick();
      success.should.be.true();
    });

    it('shows a danger alert if a Problem is returned', async () => {
      const clock = sinon.useFakeTimers();
      const modal = mountComponent({ attachTo: document.body });
      // Wait for the iframe to load.
      await wait(200);
      await modal.get('input[type="password"]').setValue('supersecret');
      modal.vm.decrypt('/test/files/problem.html');
      // Wait for problem.html to load.
      await wait(200);
      clock.tick(1000);
      modal.should.alert(
        'danger',
        'An unknown internal problem has occurred. Please try again later.'
      );
    });

    it('continually checks for a Problem', async () => {
      const clock = sinon.useFakeTimers();
      const modal = mountComponent({ attachTo: document.body });
      // Wait for the iframe to load.
      await wait(200);
      await modal.get('input[type="password"]').setValue('supersecret');
      // In production, it seems that the iframe changes pages if a Problem is
      // returned after the form submission, but it does not change pages if the
      // submission is successful. However, in testing, the iframe always seems
      // to change pages after the form is submitted. To prevent that, here we
      // prevent default.
      const doc = modal.vm.$refs.iframe.contentWindow.document;
      doc.addEventListener('submit', (event) => { event.preventDefault(); });
      modal.vm.decrypt('/v1/projects/1/forms/f/submissions.csv.zip');
      const checkForProblem = sinon.spy(modal.vm, 'checkForProblem');
      clock.tick(1000);
      checkForProblem.callCount.should.equal(1);
      // Wait for the callWait promise to resolve.
      await modal.vm.$nextTick();
      clock.tick(1000);
      checkForProblem.callCount.should.equal(2);
    });
  });
});
