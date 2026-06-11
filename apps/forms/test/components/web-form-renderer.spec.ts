import { createRouter, createWebHistory } from 'vue-router';
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import WebFormRenderer from '../../src/components/web-form-renderer.vue';
import { flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
})

const simpleForm = `
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:jr="http://openrosa.org/javarosa">
    <h:head>
        <h:title>simple</h:title>
        <model>
            <instance>
                <data id="simple">
                    <meta>
                        <instanceID/>
                    </meta>
                    <first_name/>
                </data>
            </instance>
            <bind nodeset="/data/meta/instanceID" type="string" readonly="true()" calculate="concat('uuid:', uuid())"/>
            <bind nodeset="/data/first_name" type="string"/>
        </model>
    </h:head>
    <h:body>
        <input ref="/data/first_name">
            <label>First Name</label>
        </input>
    </h:body>
</h:html>
`;

const formWithAttachmentXml = `<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:jr="http://openrosa.org/javarosa">
    <h:head>
        <h:title>simple</h:title>
        <model>
            <instance>
                <data id="simple">
                    <meta>
                        <instanceID/>
                    </meta>
                    <first_name/>
                    <city/>
                </data>
            </instance>
            <instance id="cities" src="jr://file-csv/cities.csv"/>
            <bind nodeset="/data/meta/instanceID" type="string" readonly="true()" calculate="concat('uuid:', uuid())"/>
            <bind nodeset="/data/first_name" type="string"/>
            <bind nodeset="/data/city" type="string"/>
        </model>
    </h:head>
    <h:body>
        <input ref="/data/first_name">
            <label>First Name</label>
        </input>
        <select1 ref="/data/city">
            <label>City</label>
            <itemset nodeset="instance('cities')/root/item">
                <value ref="name"/>
                <label ref="label"/>
            </itemset>
        </select1>
    </h:body>
</h:html>`

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'sendingDataModal.title': () => 'sending',
      'sendingDataModal.body': () => '',
      'action.close': () => 'close',
      'submissionModal.title': () => 'Form successfully sent!',
      'submissionModal.body': () => '',
      'submissionModal.action.fillOutAgain': () => '',
    },
  },
});

describe('WebFormRenderer', () => {
  const mountComponent = async (xform) => {

    const component = mount(WebFormRenderer, {
      global: {
        plugins: [router, i18n]
      },
      props: {
        xform,
        form: { name: 'simple', xmlFormId: 'simple', projectId: 1, enketoId: '', state: 'open', draft: false, webformsEnabled: false },
        actionType: 'new'
      }
    });
    await flushPromises();
    return component;
  };

  it.skip('should show ODK Web Form', async () => {
    const component = await mountComponent(simpleForm);
    const form = component.find('.odk-form');
    expect(form.exists()).to.equal(true);
  });

  it.skip('should load form attachments', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('name,label\ntoronto,Toronto'),
    } as Response);
    const component = await mountComponent(formWithAttachmentXml);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const form = component.find('.odk-form');
    expect(form.exists()).to.equal(true);
    expect(form.text()).to.match(/Toronto/);
    fetchSpy.mockReset();
  });

  it.skip('should send submission xml request', async () => {
    
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>  Promise.resolve({ instanceId: 1 }),
    } as Response);
    const component = await mountComponent(simpleForm);
    await component.find('.odk-form .footer button').trigger('click');
    await vi.waitFor(() => {
      const el = document.querySelector('.p-dialog-header')
      if (!el) throw new Error('Not ready yet')
    })
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls.length).to.equal(1);
    const firstCall = fetchSpy.mock.calls[0]!;
    const url = firstCall[0];
    const args = firstCall[1]!;
    expect(url).to.equal(`/v1/projects/1/forms/simple/submissions`);
    expect(args.method).to.equal('POST');
    expect(args.headers!['Content-Type']).to.equal('text/xml');
    expect((args.body as File).name).to.equal('xml_submission_file');
    fetchSpy.mockReset();
  });




//   it('should show success modal after submission request', async () => {
//     testData.extendedForms.createPast(1, { xmlFormId: 'a' });

//     const component = await mountComponent()
//       .complete()
//       .request((c) => c.find('.odk-form .footer button').trigger('click'))
//       .respondWithData(() => ({ currentVersion: { instanceId: '123' } }));

//     const modal = component.get('#web-form-renderer-submission-modal');

//     modal.find('.modal-title').text().should.equal('Form successfully sent!');
//     modal.find('.modal-introduction').text().should.equal('You can fill this Form out again or close if you’re done.');
//   });

//   it('clears the form on Fill out again button', async () => {
//     testData.extendedForms.createPast(1, { xmlFormId: 'a' });

//     const component = await mountComponent()
//       .complete()
//       .request((c) => {
//         const textbox = c.find('input');
//         textbox.element.value = 'test';
//         return c.find('.odk-form .footer button').trigger('click');
//       })
//       .respondWithData(() => ({ currentVersion: { instanceId: '123' } }));

//     const modal = component.get('#web-form-renderer-submission-modal');

//     modal.find('.modal-title').text().should.equal('Form successfully sent!');
//     modal.find('.modal-introduction').text().should.equal('You can fill this Form out again or close if you’re done.');
//     await modal.find('.btn-primary').trigger('click');
//     component.find('input').element.value.should.be.empty;
//   });

//   it('should show error modal in case of submission failure', async () => {
//     testData.extendedForms.createPast(1, { xmlFormId: 'a' });

//     const component = await mountComponent()
//       .complete()
//       .request((c) => c.find('.odk-form .footer button').trigger('click'))
//       .respondWithProblem({ code: 409.1, message: 'duplication instance ID' });

//     const modal = component.get('#web-form-renderer-submission-modal');

//     modal.find('.modal-title').text().should.equal('Submission error');
//     modal.find('.modal-introduction').text().should.match(/Your data was not submitted.*duplication instance ID/);
//     const primaryButtons = modal.findAll('.btn-primary');
//     primaryButtons.length.should.be.equal(1);
//     primaryButtons[0].text().should.be.equal('Close');
//   });

//   it('should show sessionTimeout modal in case of session expiry', async () => {
//     testData.extendedForms.createPast(1, { xmlFormId: 'a' });

//     const component = await mountComponent()
//       .complete()
//       .request((c) => c.find('.odk-form .footer button').trigger('click'))
//       .respondWithProblem(401.2);

//     const modal = component.getComponent(Modal);

//     modal.find('.modal-title').text().should.equal('Session expired');
//     modal.find('.modal-introduction').text().should.equal('Please log in here in a different browser tab and try again.');
//     modal.props().hideable.should.be.true;
//   });

//   it('shows preview modal', async () => {
//     testData.extendedForms.createPast(1, { xmlFormId: 'a' });

//     const component = await mountComponent({ props: { actionType: 'preview' } })
//       .testModalToggles({
//         modal: Modal,
//         show: '.odk-form .footer button',
//         hide: '.btn-primary'
//       });

//     await component.find('.odk-form .footer button').trigger('click');

//     await wait();

//     const modal = component.get('#web-form-renderer-submission-modal');

//     modal.find('.modal-introduction').text().should.equal('The data you entered is valid, but it was not submitted because this is a Form preview.');
//     modal.find('.modal-title').text().should.equal('Data is valid');
//   });

//   it('should show loading modal', async () => {
//     testData.extendedForms.createPast(1, { xmlFormId: 'a' });

//     await mountComponent()
//       .complete()
//       .request((c) => c.find('.odk-form .footer button').trigger('click'))
//       .beforeEachResponse(c => {
//         const modal = c.findComponent(Modal);
//         modal.props().state.should.be.true;
//         modal.find('.modal-title').text().should.equal('Sending Submission');
//       })
//       .respondWithData(() => ({ currentVersion: { instanceId: '123' } }));
//   });

//   // Minimal valid 1x1 pixel GIF
//   const gifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
//   const gifBinary = atob(gifBase64);
//   const gifBytes = Uint8Array.from(gifBinary, c => c.charCodeAt(0));
//   const fileToUpload = new File([gifBytes], '1746140510984.gif', { type: 'image/gif' });

//   const uploadFile = async (component) => {
//     await setFiles(component.find('.odk-form input[type="file"]'), [fileToUpload]);
//   };

//   it('should send submission attachment request - relies on OWF', async () => {
//     testData.extendedForms.createPast(1, { xmlFormId: 'a' });

//     const component = await mountComponent({}, imageUploaderXml)
//       .complete()
//       .request(async (c) => {
//         await uploadFile(c);
//         return c.find('.odk-form .footer button').trigger('click');
//       })
//       .respondWithData(() => ({ currentVersion: { instanceId: '123' } }))
//       .respondWithSuccess(); // upload attachment successful

//     const modal = component.get('#web-form-renderer-submission-modal');

//     modal.find('.modal-title').text().should.equal('Form successfully sent!');
//     modal.find('.modal-introduction').text().should.equal('You can fill this Form out again or close if you’re done.');
//   });

//   it('should show retry modal if attachment upload fails - relies on OWF', async () => {
//     testData.extendedForms.createPast(1, { xmlFormId: 'a' });

//     const component = await mountComponent({}, imageUploaderXml)
//       .complete()
//       .request(async (c) => {
//         await uploadFile(c);
//         return c.find('.odk-form .footer button').trigger('click');
//       })
//       .respondWithData(() => ({ currentVersion: { instanceId: '123' } }))
//       .respondWithProblem(); // upload attachment error

//     const modal = component.get('#web-form-renderer-submission-modal');

//     modal.find('.modal-title').text().should.equal('Submission error');
//     modal.find('.modal-introduction').text().should.match(/Your data was not fully submitted.*Please press the “Try again” button to retry/);
//   });

//   it('should send only submission attachment request on retry', async () => {
//     testData.extendedForms.createPast(1, { xmlFormId: 'a' });

//     const component = await mountComponent({}, imageUploaderXml)
//       .complete()
//       .request(async (c) => {
//         await uploadFile(c);
//         return c.find('.odk-form .footer button').trigger('click');
//       })
//       .respondWithData(() => ({ currentVersion: { instanceId: '123' } }))
//       .respondWithProblem() // upload attachment error
//       .complete()
//       .request(async (c) => {
//         const modal = c.get('#web-form-renderer-submission-modal');
//         modal.find('.modal-title').text().should.equal('Submission error');
//         return modal.find('.btn-primary').trigger('click');
//       })
//       .respondWithSuccess()
//       .testRequests([
//         {
//           method: 'POST',
//           url: ({ pathname }) => pathname.should.match(/attachments.*gif/),
//           data: fileToUpload,
//           headers: { 'content-type': 'image/gif' }
//         }
//       ]);

//     const modal = component.get('#web-form-renderer-submission-modal');

//     modal.find('.modal-title').text().should.equal('Form successfully sent!');
//     modal.find('.modal-introduction').text().should.equal('You can fill this Form out again or close if you’re done.');
//   });

//   it('should show non-hideable sessionTimeout modal if attachment upload fails during session expiry - relies on OWF', async () => {
//     testData.extendedForms.createPast(1, { xmlFormId: 'a' });

//     const component = await mountComponent({}, imageUploaderXml)
//       .complete()
//       .request(async (c) => {
//         await uploadFile(c);
//         return c.find('.odk-form .footer button').trigger('click');
//       })
//       .respondWithData(() => ({ currentVersion: { instanceId: '123' } }))
//       .respondWithProblem(401.2);

//     const modal = component.getComponent(Modal);

//     modal.find('.modal-title').text().should.equal('Session expired');
//     modal.find('.modal-introduction').text().should.equal('Please log in here in a different browser tab and try again.');
//     modal.props().hideable.should.be.false;
//   });

//   describe('edit', () => {
//     it('should load submission instance for edits', async () => {
//       testData.extendedForms.createPast(1, { xmlFormId: 'a' });

//       const component = await mountComponent({
//         props: {
//           actionType: 'edit',
//           instanceId: 'uuid:01f165e1-8814-43b8-83ec-741222b00f25'
//         }
//       })
//         .respondWithData(() => [])
//         .respondWithData(() => simpleSubmission);

//       component.find('.odk-form').exists().should.be.true;
//     });

//     it('should send PUT submission request on send button and redirect', async () => {
//       testData.extendedForms.createPast(1, { xmlFormId: 'a' });
//       const clock = sinon.useFakeTimers();

//       await mountComponent({
//         props: {
//           actionType: 'edit',
//           instanceId: 'uuid:01f165e1-8814-43b8-83ec-741222b00f25'
//         }
//       })
//         .respondWithData(() => [])
//         .respondWithData(() => simpleSubmission)
//         .complete()
//         .request(async (c) => {
//           await c.find('.odk-form .footer button').trigger('click');
//           await clock.tick(0);
//         })
//         .respondWithData(() => ({ currentVersion: { instanceId: '123' } }))
//         .beforeEachResponse((_, config) => {
//           const { headers, url, method, data } = config;
//           url.should.be.eql('/v1/projects/1/forms/a/submissions/uuid%3A01f165e1-8814-43b8-83ec-741222b00f25');
//           method.should.be.eql('PUT');
//           JSON.stringify(data).should.match(/xml_submission_file/);
//           headers['content-type'].should.be.eql('text/xml');
//           headers['odk-client'].should.be.match(/odk-web-forms/);
//         })
//         .afterResponses(async c => {
//           await clock.tick(2000);
//           c.vm.$router.push.calledWith('/projects/1/forms/a/submissions/uuid%3A01f165e1-8814-43b8-83ec-741222b00f25').should.be.true;
//         });
//     });

//     it('should make requests for attachment data - relies on OWF', async () => {
//       testData.extendedForms.createPast(1, { xmlFormId: 'a' });

//       const component = await mountComponent({
//         props: {
//           actionType: 'edit',
//           instanceId: 'uuid:01f165e1-8814-43b8-83ec-741222b00f25'
//         }
//       }, imageUploaderXml)
//         .beforeEachResponse((_, { url }, i) => {
//           if (i === 3) {
//             url.endsWith('1746140510984.jpg').should.be.true;
//           }
//         })
//         .respondWithData(() => [{ name: '1746140510984.jpg', exists: true }])
//         .respondWithData(() => imageUploaderSubmission)
//         .respondWithData(() => gifBinary);

//       await waitUntil(() => component.find('.odk-form').exists());
//       component.find('.odk-form h1').text().should.be.equal('Display Picture');
//     });

//     it('should make not requests for attachment data when attachment doesnt exist - relies on OWF', async () => {
//       testData.extendedForms.createPast(1, { xmlFormId: 'a' });

//       const component = await mountComponent({
//         props: {
//           actionType: 'edit',
//           instanceId: 'uuid:01f165e1-8814-43b8-83ec-741222b00f25'
//         }
//       }, imageUploaderXml)
//         .respondWithData(() => [{ name: '1746140510984.jpg', exists: false }])
//         .respondWithData(() => imageUploaderSubmission);

//       await waitUntil(() => component.find('.odk-form').exists());
//       component.find('.odk-form h1').text().should.be.equal('Display Picture');
//     });
//   });

});