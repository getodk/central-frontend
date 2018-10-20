import Form from '../../../../lib/presenters/form';
import FormAnalyze from '../../../../lib/components/form/submission/analyze.vue';
import FormSubmissions from '../../../../lib/components/form/submission/list.vue';
import testData from '../../../data';
import { mockHttp, mockRoute } from '../../../http';
import { mockLogin } from '../../../session';
import { mountAndMark } from '../../../destroy';
import { trigger } from '../../../event';

const createFormWithSubmission = () => {
  testData.extendedForms.createPast(1);
  testData.extendedSubmissions.createPast(1);
  return testData.extendedForms.last();
};
const submissionsPath = (form) => `/forms/${form.xmlFormId}/submissions`;
const clickAnalyzeButton = (wrapper) =>
  trigger.click(wrapper.first('#form-submissions-analyze-button'))
    .then(() => wrapper);
const clickTab = (wrapper, tabText) => {
  for (const a of wrapper.find('#form-analyze .nav-tabs a')) {
    if (a.text().trim() === tabText)
      return trigger.click(a).then(() => wrapper);
  }
  throw new Error('tab not found');
};

describe('FormAnalyze', () => {
  beforeEach(mockLogin);

  it('opens the modal upon button click', () =>
    mockHttp()
      .mount(FormSubmissions, {
        propsData: { form: new Form(createFormWithSubmission()) }
      })
      .respondWithData(() => testData.extendedForms.last()._schema)
      .respondWithData(testData.submissionOData)
      .afterResponse(component => {
        component.first(FormAnalyze).getProp('state').should.be.false();
        return component;
      })
      .then(clickAnalyzeButton)
      .then(component => {
        component.first(FormAnalyze).getProp('state').should.be.true();
      }));

  it('selects the OData URL upon click', () =>
    mockRoute(submissionsPath(createFormWithSubmission()), { attachToDocument: true })
      .respondWithData(() => testData.extendedForms.last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .respondWithData(() => testData.extendedForms.last()._schema)
      .respondWithData(testData.submissionOData)
      .afterResponses(clickAnalyzeButton)
      .then(app =>
        trigger.click(app.first('#form-analyze-odata-url')).then(() => app))
      .then(() => {
        const selection = window.getSelection();
        const url = $('#form-analyze-odata-url')[0];
        selection.anchorNode.should.equal(url);
        selection.focusNode.should.equal(url);
      }));

  describe('tool info', () => {
    let modal;
    beforeEach(() => {
      modal = mountAndMark(FormAnalyze, {
        propsData: { form: new Form(createFormWithSubmission()) }
      });
    });

    const assertContent = (tabText, urlSuffix, hasHelp) => {
      // Test the text of the active tab.
      const activeTab = modal.first('.nav-tabs li.active');
      activeTab.first('a').text().trim().should.equal(tabText);
      // Test the OData URL.
      const { xmlFormId } = testData.extendedForms.last();
      const baseUrl = `${window.location.origin}/v1/forms/${xmlFormId}.svc`;
      const url = `${baseUrl}${urlSuffix}`;
      modal.first('#form-analyze-odata-url').text().trim().should.equal(url);
      // Test the presence of help text.
      const help = modal.first('#form-analyze-tool-help');
      ($(help.element).children().length !== 0).should.equal(hasHelp);
    };

    it('defaults to Excel/Power BI', () => {
      assertContent('Excel/Power BI', '', true);
    });

    it('Excel/Power BI', () => clickTab(modal, 'Tableau')
      .then(() => clickTab(modal, 'Excel/Power BI'))
      .then(() => assertContent('Excel/Power BI', '', true)));

    it('Tableau', () => clickTab(modal, 'Tableau')
      .then(() => assertContent('Tableau', '/Submissions?$wkt=true', true)));

    it('Other', () => clickTab(modal, 'Other')
      .then(() => assertContent('Other', '', false)));
  });
});
