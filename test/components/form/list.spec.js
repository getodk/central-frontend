import Form from '../../../src/presenters/form';
import FormList from '../../../src/components/form/list.vue';
import testData from '../../data';
import { formatDate } from '../../../src/util/util';
import { mockLogin } from '../../session';
import { mockRoute } from '../../http';
import { mountAndMark } from '../../destroy';

describe('FormList', () => {
  it('correctly renders the table', () => {
    mockLogin();
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
    mockLogin();
    const component = mountAndMark(FormList, {
      requestData: { forms: [] }
    });
    component.first('#form-list-empty-message').should.be.visible();
  });

  it('encodes the URL to the form overview page', () => {
    mockLogin();
    const { project, form } = testData.createProjectAndFormWithoutSubmissions({
      form: { xmlFormId: 'i ı' }
    });
    return mockRoute('/projects/1')
      .respondWithData(() => project)
      .respondWithData(() => [form])
      .afterResponses(app => {
        const href = app.first('.form-list-form-name').getAttribute('href');
        href.should.equal('#/projects/1/forms/i%20%C4%B1');
      });
  });

  it('links to the submissions page for a project viewer', () => {
    mockLogin({ role: 'none' });
    const { project, form } = testData.createProjectAndFormWithoutSubmissions({
      project: { role: 'viewer' },
      form: { xmlFormId: 'f' }
    });
    return mockRoute('/projects/1')
      .respondWithData(() => project)
      .respondWithData(() => [form])
      .afterResponses(app => {
        const href = app.first('.form-list-form-name').getAttribute('href');
        href.should.equal('#/projects/1/forms/f/submissions');
      });
  });
});
