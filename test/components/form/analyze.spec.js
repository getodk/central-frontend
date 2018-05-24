/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import FormAnalyze from '../../../lib/components/form/analyze.vue';
import FormSubmissions from '../../../lib/components/form/submissions.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';
import { trigger } from '../../util';

const createFormWithSubmission = () => {
  testData.extendedForms.createPast(1);
  testData.extendedSubmissions.createPast(1);
  return testData.extendedForms.last();
};
const submissionsPath = (form) => `/forms/${form.xmlFormId}/submissions`;
const propsData = () => ({
  propsData: {
    form: createFormWithSubmission()
  }
});
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
      .mount(FormSubmissions, propsData())
      .respondWithData(() => testData.extendedSubmissions.sorted())
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
      .respondWithData(() => testData.simpleForms.last())
      .respondWithData(() => testData.extendedSubmissions.sorted())
      .afterResponse(clickAnalyzeButton)
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
      modal = mountAndMark(FormAnalyze, propsData());
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
