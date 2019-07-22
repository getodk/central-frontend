import SubmissionAnalyze from '../../../src/components/submission/analyze.vue';
import SubmissionList from '../../../src/components/submission/list.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';
import { trigger } from '../../event';

const clickTab = (wrapper, tabText) => {
  for (const a of wrapper.find('#submission-analyze .nav-tabs a')) {
    if (a.text().trim() === tabText)
      return trigger.click(a).then(() => wrapper);
  }
  throw new Error('tab not found');
};

describe('SubmissionAnalyze', () => {
  beforeEach(mockLogin);

  it('opens the modal upon button click', () => {
    const form = testData.extendedForms
      .createPast(1, { submissions: 1 })
      .last();
    testData.extendedSubmissions.createPast(1);

    return mockHttp()
      .mount(SubmissionList, {
        propsData: {
          projectId: '1',
          xmlFormId: form.xmlFormId
        },
        requestData: { form }
      })
      .request(component => {
        // Normally the `activated` hook calls this method, but that hook is not
        // called here, so we call the method ourselves instead.
        component.vm.fetchSchemaAndFirstChunk();
      })
      .respondWithData(() => testData.extendedForms.last()._schema)
      .respondWithData(testData.submissionOData)
      .afterResponses(component => {
        component.first(SubmissionAnalyze).getProp('state').should.be.false();
        return component;
      })
      .then(component =>
        trigger.click(component, '#submission-list-analyze-button'))
      .then(component => {
        component.first(SubmissionAnalyze).getProp('state').should.be.true();
      });
  });

  it('selects the OData URL upon click', () => {
    const form = testData.extendedForms
      .createPast(1, { submissions: 1 })
      .last();
    testData.extendedSubmissions.createPast(1);

    const path = `/projects/1/forms/${encodeURIComponent(form.xmlFormId)}/submissions`;
    return mockRoute(path, { attachToDocument: true })
      .respondWithData(() => testData.extendedProjects.last())
      .respondWithData(() => testData.extendedForms.last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .respondWithData(() => testData.extendedForms.last()._schema)
      .respondWithData(testData.submissionOData)
      .afterResponses(app =>
        trigger.click(app, '#submission-list-analyze-button'))
      .then(app => trigger.click(app, '#submission-analyze-odata-url'))
      .then(() => {
        const selection = window.getSelection();
        const url = $('#submission-analyze-odata-url')[0];
        selection.anchorNode.should.equal(url);
        selection.focusNode.should.equal(url);
      });
  });

  describe('tool info', () => {
    let modal;
    beforeEach(() => {
      const form = testData.extendedForms
        .createPast(1, { submissions: 1 })
        .last();
      testData.extendedSubmissions.createPast(1);

      modal = mountAndMark(SubmissionAnalyze, {
        propsData: { projectId: '1' },
        requestData: { form }
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
      modal.first('#submission-analyze-odata-url').text().trim().should.equal(url);
      // Test the presence of help text.
      const help = modal.first('#submission-analyze-tool-help');
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
