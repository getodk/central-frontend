import sinon from 'sinon';

import Modal from '../../src/components/modal.vue';

import { mockHttp } from '../util/http';
import createTestContainer from '../util/container';
import { mockRouter } from '../util/router';
import { testRequestData } from '../util/request-data';
import testData from '../data';
import simpleXml from '../data/xml/simple/form.xml';
import simpleSubmission from '../data/xml/simple/submission.xml';
import imageUploaderXml from '../data/xml/image-uploader/form.xml';
import imageUploaderSubmission from '../data/xml/image-uploader/submission.xml';
import formWithAttachmentXml from '../data/xml/with-attachment/form.xml';
import { mockLogin } from '../util/session';
import { mergeMountOptions } from '../util/lifecycle';
import { setFiles } from '../util/trigger';
import { wait } from '../util/util';

describe('WebFormRenderer', () => {
  let WebFormRenderer;

  beforeAll(async () => {
    // importing this at the top causes this file to be skipped by karma/mocha
    const webFormRenderer = await import('../../src/components/web-form-renderer.vue');
    WebFormRenderer = webFormRenderer.default;
  });

  beforeEach(() => {
    mockLogin();
  });

  const mountComponent = (options, formXml = simpleXml) => {
    const container = createTestContainer({
      requestData: testRequestData([], {
        form: testData.extendedForms.last()
      }),
      router: mockRouter('/')
    });
    return mockHttp()
      .mount(WebFormRenderer, mergeMountOptions(options, {
        container,
        props: { actionType: 'new' }
      }))
      .respondWithData(() => formXml);
  };

  it('should send xml request', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    return mountComponent()
      .testRequests([
        { url: '/v1/projects/1/forms/a.xml' }
      ]);
  });

  it('should show ODK Web Form', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const component = await mountComponent();

    component.find('.odk-form').exists().should.be.true;
  });

  it('should load form attachments', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const component = await mountComponent({}, formWithAttachmentXml)
      .respondWithData(() => 'name,label\ntoronto,Toronto')
      .testRequests([
        { url: '/v1/projects/1/forms/a.xml' },
        { url: '/v1/projects/1/forms/a/attachments/cities.csv' },
      ]);

    component.find('.odk-form').exists().should.be.true;
    component.find('.odk-form').text().should.match(/Toronto/);
  });

  it('should send submission xml request', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    await mountComponent()
      .complete()
      .request((c) => c.find('.odk-form .footer button').trigger('click'))
      .respondWithData(() => ({ currentVersion: { instanceId: '123' } }))
      .testRequests([
        {
          url: '/v1/projects/1/forms/a/submissions',
          method: 'POST',
          headers: { 'content-type': 'text/xml' },
          data: { name: 'xml_submission_file', type: 'text/xml' }
        }
      ]);
  });

  it('should show success modal after submission request', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const component = await mountComponent()
      .complete()
      .request((c) => c.find('.odk-form .footer button').trigger('click'))
      .respondWithData(() => ({ currentVersion: { instanceId: '123' } }));

    const modal = component.get('#web-form-renderer-submission-modal');

    modal.find('.modal-title').text().should.equal('Form successfully sent!');
    modal.find('.modal-introduction').text().should.equal('You can fill this Form out again or close if you’re done.');
  });

  it('clears the form on Fill out again button', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const component = await mountComponent()
      .complete()
      .request((c) => {
        const textbox = c.find('input');
        textbox.element.value = 'test';
        return c.find('.odk-form .footer button').trigger('click');
      })
      .respondWithData(() => ({ currentVersion: { instanceId: '123' } }));

    const modal = component.get('#web-form-renderer-submission-modal');

    modal.find('.modal-title').text().should.equal('Form successfully sent!');
    modal.find('.modal-introduction').text().should.equal('You can fill this Form out again or close if you’re done.');
    await modal.find('.btn-primary').trigger('click');
    component.find('input').element.value.should.be.empty;
  });

  it('should show error modal in case of submission failure', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const component = await mountComponent()
      .complete()
      .request((c) => c.find('.odk-form .footer button').trigger('click'))
      .respondWithProblem({ code: 409.1, message: 'duplication instance ID' });

    const modal = component.get('#web-form-renderer-submission-modal');

    modal.find('.modal-title').text().should.equal('Submission error');
    modal.find('.modal-introduction').text().should.match(/Your data was not submitted.*duplication instance ID/);
    const primaryButtons = modal.findAll('.btn-primary');
    primaryButtons.length.should.be.equal(1);
    primaryButtons[0].text().should.be.equal('Close');
  });

  it('should show sessionTimeout modal in case of session expiry', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const component = await mountComponent()
      .complete()
      .request((c) => c.find('.odk-form .footer button').trigger('click'))
      .respondWithProblem(403.1);

    const modal = component.getComponent(Modal);

    modal.find('.modal-title').text().should.equal('Session expired');
    modal.find('.modal-introduction').text().should.equal('Please log in here in a different browser tab and try again.');
    modal.props().hideable.should.be.true;
  });

  it('shows preview modal', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const component = await mountComponent({ props: { actionType: 'preview' } })
      .testModalToggles({
        modal: Modal,
        show: '.odk-form .footer button',
        hide: '.btn-primary'
      });

    await component.find('.odk-form .footer button').trigger('click');

    const modal = component.get('#web-form-renderer-submission-modal');

    modal.find('.modal-introduction').text().should.equal('The data you entered is valid, but it was not submitted because this is a Form preview.');
    modal.find('.modal-title').text().should.equal('Data is valid');
  });

  it('should show loading modal', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    await mountComponent()
      .complete()
      .request((c) => c.find('.odk-form .footer button').trigger('click'))
      .beforeEachResponse(c => {
        const modal = c.findComponent(Modal);
        modal.props().state.should.be.true;
        modal.find('.modal-title').text().should.equal('Sending Submission');
      })
      .respondWithData(() => ({ currentVersion: { instanceId: '123' } }));
  });

  const fileToUpload = new File(['dummy content'], '1746140510984.jpg', { type: 'image/jpeg' });

  const uploadFile = async (component) => {
    await setFiles(component.find('.odk-form input[type="file"]'), [fileToUpload]);
  };

  it('should send submission attachment request - relies on OWF', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const component = await mountComponent({}, imageUploaderXml)
      .complete()
      .request(async (c) => {
        await uploadFile(c);
        return c.find('.odk-form .footer button').trigger('click');
      })
      .respondWithData(() => ({ currentVersion: { instanceId: '123' } }))
      .respondWithSuccess(); // upload attachment successful

    const modal = component.get('#web-form-renderer-submission-modal');

    modal.find('.modal-title').text().should.equal('Form successfully sent!');
    modal.find('.modal-introduction').text().should.equal('You can fill this Form out again or close if you’re done.');
  });

  it('should show retry modal if attachment upload fails - relies on OWF', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const component = await mountComponent({}, imageUploaderXml)
      .complete()
      .request(async (c) => {
        await uploadFile(c);
        return c.find('.odk-form .footer button').trigger('click');
      })
      .respondWithData(() => ({ currentVersion: { instanceId: '123' } }))
      .respondWithProblem(); // upload attachment error

    const modal = component.get('#web-form-renderer-submission-modal');

    modal.find('.modal-title').text().should.equal('Submission error');
    modal.find('.modal-introduction').text().should.match(/Your data was not fully submitted.*Please press the “Try again” button to retry/);
  });

  it('should send only submission attachment request on retry', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const component = await mountComponent({}, imageUploaderXml)
      .complete()
      .request(async (c) => {
        await uploadFile(c);
        return c.find('.odk-form .footer button').trigger('click');
      })
      .respondWithData(() => ({ currentVersion: { instanceId: '123' } }))
      .respondWithProblem() // upload attachment error
      .complete()
      .request(async (c) => {
        const modal = c.get('#web-form-renderer-submission-modal');
        modal.find('.modal-title').text().should.equal('Submission error');
        return modal.find('.btn-primary').trigger('click');
      })
      .respondWithSuccess()
      .testRequests([
        {
          method: 'POST',
          url: ({ pathname }) => pathname.should.match(/attachments.*jpg/),
          data: fileToUpload,
          headers: { 'content-type': 'image/jpeg' }
        }
      ]);

    const modal = component.get('#web-form-renderer-submission-modal');

    modal.find('.modal-title').text().should.equal('Form successfully sent!');
    modal.find('.modal-introduction').text().should.equal('You can fill this Form out again or close if you’re done.');
  });

  it('should show non-hideable sessionTimeout modal if attachment upload fails during session expiry - relies on OWF', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const component = await mountComponent({}, imageUploaderXml)
      .complete()
      .request(async (c) => {
        await uploadFile(c);
        return c.find('.odk-form .footer button').trigger('click');
      })
      .respondWithData(() => ({ currentVersion: { instanceId: '123' } }))
      .respondWithProblem(403.1);

    const modal = component.getComponent(Modal);

    modal.find('.modal-title').text().should.equal('Session expired');
    modal.find('.modal-introduction').text().should.equal('Please log in here in a different browser tab and try again.');
    modal.props().hideable.should.be.false;
  });

  describe('edit', () => {
    it('should load submission instance for edits', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });

      const component = await mountComponent({
        props: {
          actionType: 'edit',
          instanceId: 'uuid:01f165e1-8814-43b8-83ec-741222b00f25'
        }
      })
        .respondWithData(() => [])
        .respondWithData(() => simpleSubmission);

      component.find('.odk-form').exists().should.be.true;
    });

    it('should send PUT submission request on send button and redirect', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });
      const clock = sinon.useFakeTimers();

      await mountComponent({
        props: {
          actionType: 'edit',
          instanceId: 'uuid:01f165e1-8814-43b8-83ec-741222b00f25'
        }
      })
        .respondWithData(() => [])
        .respondWithData(() => simpleSubmission)
        .complete()
        .request((c) => c.find('.odk-form .footer button').trigger('click'))
        .respondWithData(() => ({ currentVersion: { instanceId: '123' } }))
        .testRequests([
          {
            url: '/v1/projects/1/forms/a/submissions/uuid%3A01f165e1-8814-43b8-83ec-741222b00f25',
            method: 'PUT',
            headers: { 'content-type': 'text/xml' },
            data: { name: 'xml_submission_file', type: 'text/xml' }
          }
        ])
        .afterResponses(async c => {
          await clock.tick(2000);
          c.vm.$router.push.calledWith('/projects/1/forms/a/submissions/uuid%3A01f165e1-8814-43b8-83ec-741222b00f25').should.be.true;
        });
    });

    it('should make requests for attachment data - relies on OWF', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });

      const component = await mountComponent({
        props: {
          actionType: 'edit',
          instanceId: 'uuid:01f165e1-8814-43b8-83ec-741222b00f25'
        }
      }, imageUploaderXml)
        .beforeEachResponse((_, { url }, i) => {
          if (i === 3) {
            url.endsWith('1746140510984.jpg').should.be.true;
          }
        })
        .respondWithData(() => [{ name: '1746140510984.jpg', exists: true }])
        .respondWithData(() => imageUploaderSubmission)
        .respondWithData(() => 'dummy content');

      await wait(1); // Not 100% sure, but OWF is probably using setTimeout before loading the Form
      component.find('.odk-form').exists().should.be.true;
    });

    it('should make not requests for attachment data when attachment doesnt exist - relies on OWF', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });

      const component = await mountComponent({
        props: {
          actionType: 'edit',
          instanceId: 'uuid:01f165e1-8814-43b8-83ec-741222b00f25'
        }
      }, imageUploaderXml)
        .respondWithData(() => [{ name: '1746140510984.jpg', exists: false }])
        .respondWithData(() => imageUploaderSubmission);

      await wait(1); // Not 100% sure, but OWF is probably using setTimeout before loading the Form
      component.find('.odk-form').exists().should.be.true;
    });
  });
});
