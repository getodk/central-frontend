import Form from '../../../src/presenters/form';
import FormList from '../../../src/components/form/list.vue';
import testData from '../../data';
import { formatDate } from '../../../src/util/util';
import { mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';
import { trigger } from '../../event';

describe('FormList', () => {
  beforeEach(mockLogin);

  it('table contains the correct data', () => {
    testData.extendedProjects.createPast(1);
    const forms = testData.extendedForms.createPast(2).sorted();
    return mockRoute('/projects/1')
      .respondWithData(() => testData.extendedProjects.last())
      .respondWithData(() => forms)
      .afterResponse(page => {
        const tr = page.find('table tbody tr');
        tr.length.should.equal(forms.length);
        for (let i = 0; i < tr.length; i += 1) {
          const td = tr[i].find('td');
          td.length.should.equal(4);
          const form = new Form(forms[i]);

          // First column
          const nameOrId = td[0].first('.form-list-form-name').text().trim();
          nameOrId.should.equal(form.nameOrId());
          if (form.name != null) {
            const xmlFormId = td[0].first('.form-list-form-id').text().trim();
            xmlFormId.should.equal(form.xmlFormId);
          }
          const submissions = td[0].first('.form-list-submissions').text().trim();
          submissions.should.containEql(form.submissions.toLocaleString());

          td[1].text().trim().should.equal(form.createdBy != null
            ? form.createdBy.displayName
            : '');
          td[2].text().trim().should.equal(formatDate(form.updatedOrCreatedAt()));
          td[3].text().trim().should.equal(formatDate(form.lastSubmission));
        }
      });
  });

  it('shows a message if there are no forms', () => {
    const component = mountAndMark(FormList, {
      propsData: { projectId: '1' },
      requestData: { forms: [] }
    });
    const text = component.first('#form-list-empty-message').text().trim();
    text.should.be.ok();
  });

  it('encodes the URL to the form overview page', () =>
    mockRoute('/projects/1')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' }).sorted())
      .afterResponse(app => {
        const href = app.first('.form-list-form-name').getAttribute('href');
        href.should.equal('#/projects/1/forms/a%20b');
      })
      .request(app => trigger.click(app, '.form-list-form-name'))
      .beforeEachResponse((app, request, index) => {
        if (index === 0) request.url.should.equal('/v1/projects/1/forms/a%20b');
      })
      .respondWithData(() => testData.extendedForms.last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .respondWithData(() => []) // assignmentActors
      .afterResponses(app => {
        app.vm.$route.params.xmlFormId.should.equal('a b');
      }));
});
