import { mockHttp } from '../util/http';
import createTestContainer from '../util/container';
import { testRouter } from '../util/router';
import { testRequestData } from '../util/request-data';
import testData from '../data';
import simpleXml from '../data/xml/simple/form.xml';
import simpleSubmission from '../data/xml/simple/submission.xml';
import formWithAttachmentXml from '../data/xml/with-attachment/form.xml';
import { mockLogin } from '../util/session';

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

  const mountComponent = (props, formXml = simpleXml) => {
    const container = createTestContainer({
      requestData: testRequestData([], {
        form: testData.extendedForms.last()
      }),
      router: testRouter()
    });
    return mockHttp()
      .mount(WebFormRenderer, {
        container,
        props
      })
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

    const modal = component.getComponent('#web-form-renderer-submission-modal');

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

    const modal = component.getComponent('#web-form-renderer-submission-modal');

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

    const modal = component.getComponent('#web-form-renderer-submission-modal');

    modal.find('.modal-title').text().should.equal('Submission error');
    modal.find('.modal-introduction').text().should.match(/Your data was not submitted.*duplication instance ID/);
  });

  it('shows preview modal', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const component = await mountComponent({ actionType: 'preview' })
      .testModalToggles({
        modal: '#web-form-renderer-submission-modal',
        show: '.odk-form .footer button',
        hide: '.btn-primary'
      });

    await component.find('.odk-form .footer button').trigger('click');

    const modal = component.getComponent('#web-form-renderer-submission-modal');

    modal.find('.modal-introduction').text().should.equal('The data you entered is valid, but it was not submitted because this is a Form preview.');
    modal.find('.modal-title').text().should.equal('Data is valid');
  });

  it('should show loading modal', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const component = await mountComponent()
      .complete()
      .request((c) => c.find('.odk-form .footer button').trigger('click'))
      .beforeEachResponse(c => {
        c.findComponent('#sending-data').props().state.should.be.true;
      })
      .respondWithData(() => ({ currentVersion: { instanceId: '123' } }));

    component.findComponent('#sending-data').props().state.should.be.false;
  });

  describe('edit', () => {
    it('should load submission instance for edits', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });

      const component = await mountComponent({
        actionType: 'edit',
        instanceId: 'uuid:01f165e1-8814-43b8-83ec-741222b00f25'
      })
        .respondWithData(() => [])
        .respondWithData(() => simpleSubmission);

      component.find('.odk-form').exists().should.be.true;
    });

    it('should send PUT submission request on send button and redirect', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });

      await mountComponent({
        actionType: 'edit',
        instanceId: 'uuid:01f165e1-8814-43b8-83ec-741222b00f25'
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
        .afterResponses(c => {
          c.vm.$container.router.currentRoute.value.path.should
            .equal('/projects/1/forms/a/submissions/uuid%3A01f165e1-8814-43b8-83ec-741222b00f25');
        });
    });
  });
});
