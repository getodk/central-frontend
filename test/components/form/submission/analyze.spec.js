import Form from '../../../../lib/presenters/form';
import FormSubmissionAnalyze from '../../../../lib/components/form/submission/analyze.vue';
import FormSubmissionList from '../../../../lib/components/form/submission/list.vue';
import testData from '../../../data';
import { mockHttp, mockRoute } from '../../../http';
import { mockLogin } from '../../../session';
import { mountAndMark } from '../../../destroy';
import { trigger } from '../../../event';

const createFormWithSubmission = () => {
  testData.extendedProjects.createPast(1);
  const form = testData.extendedForms.createPast(1, { submissions: 1 }).last();
  testData.extendedSubmissions.createPast(1, { form });
  return form;
};
const clickAnalyzeButton = (wrapper) =>
  trigger.click(wrapper.first('#form-submission-list-analyze-button'))
    .then(() => wrapper);
const clickTab = (wrapper, tabText) => {
  for (const a of wrapper.find('#form-submission-analyze .nav-tabs a')) {
    if (a.text().trim() === tabText)
      return trigger.click(a).then(() => wrapper);
  }
  throw new Error('tab not found');
};

describe('FormSubmissionAnalyze', () => {
  beforeEach(mockLogin);

  it('opens the modal upon button click', () =>
    mockHttp()
      .mount(FormSubmissionList, {
        propsData: {
          projectId: 1,
          form: new Form(createFormWithSubmission())
        }
      })
      .respondWithData(() => testData.extendedForms.last()._schema)
      .respondWithData(testData.submissionOData)
      .afterResponse(component => {
        component.first(FormSubmissionAnalyze).getProp('state').should.be.false();
        return component;
      })
      .then(clickAnalyzeButton)
      .then(component => {
        component.first(FormSubmissionAnalyze).getProp('state').should.be.true();
      }));

  it('selects the OData URL upon click', () => {
    const { xmlFormId } = createFormWithSubmission();
    const path = `/projects/1/forms/${encodeURIComponent(xmlFormId)}/submissions`;
    return mockRoute(path, { attachToDocument: true })
      .respondWithData(() => testData.simpleProjects.last())
      .respondWithData(() => testData.extendedFieldKeys.sorted())
      .respondWithData(() => testData.extendedForms.last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .respondWithData(() => testData.extendedForms.last()._schema)
      .respondWithData(testData.submissionOData)
      .afterResponses(clickAnalyzeButton)
      .then(app => trigger.click(app, '#form-submission-analyze-odata-url'))
      .then(() => {
        const selection = window.getSelection();
        const url = $('#form-submission-analyze-odata-url')[0];
        selection.anchorNode.should.equal(url);
        selection.focusNode.should.equal(url);
      });
  });

  describe('tool info', () => {
    let modal;
    beforeEach(() => {
      modal = mountAndMark(FormSubmissionAnalyze, {
        propsData: {
          projectId: 1,
          form: new Form(createFormWithSubmission())
        }
      });
    });

    const assertContent = (tabText, urlSuffix, hasHelp) => {
      // Test the text of the active tab.
      const activeTab = modal.first('.nav-tabs li.active');
      activeTab.first('a').text().trim().should.equal(tabText);
      // Test the OData URL.
      const { xmlFormId } = testData.extendedForms.last();
      const baseUrl = `${window.location.origin}/v1/projects/1/forms/${xmlFormId}.svc`;
      const url = `${baseUrl}${urlSuffix}`;
      modal.first('#form-submission-analyze-odata-url').text().trim().should.equal(url);
      // Test the presence of help text.
      const help = modal.first('#form-submission-analyze-tool-help');
      ($(help.element).children().length !== 0).should.equal(hasHelp);
    };

    it('defaults to Excel/Power BI', () => {
      assertContent('Excel/Power BI', '', true);
    });

    it('Excel/Power BI', () => clickTab(modal, 'Tableau')
      .then(() => clickTab(modal, 'Excel/Power BI'))
      .then(() => assertContent('Excel/Power BI', '', true)));

    it('Tableau', () =>
      clickTab(modal, 'Tableau').then(() => assertContent(
        'Tableau',
        `/Submissions?${encodeURIComponent('$')}wkt=true`,
        true
      )));

    it('Other', () => clickTab(modal, 'Other')
      .then(() => assertContent('Other', '', false)));
  });
});
