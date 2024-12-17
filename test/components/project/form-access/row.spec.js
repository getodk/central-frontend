import FormLink from '../../../../src/components/form/link.vue';
import ProjectFormAccessRow from '../../../../src/components/project/form-access/row.vue';

import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';

describe('ProjectFormAccessRow', () => {
  beforeEach(mockLogin);

  it('adds a class for a form without a published version', () => {
    testData.extendedForms.createPast(1, { draft: true });
    return load('/projects/1/form-access').then(app => {
      const row = app.getComponent(ProjectFormAccessRow);
      row.classes('project-form-access-row-draft').should.be.true;
    });
  });

  it('shows an icon for a form without a published version', () => {
    testData.extendedForms.createPast(1, { draft: true });
    return load('/projects/1/form-access').then(app => {
      const td = app.get('.project-form-access-row-form-name');
      td.get('.icon-edit').should.be.visible();
    });
  });

  it("shows the form's name", async () => {
    testData.extendedForms.createPast(1, { name: 'My Form' });
    const app = await load('/projects/1/form-access');
    const link = app.get('.project-form-access-row-form-name')
      .getComponent(FormLink);
    link.props().form.name.should.equal('My Form');
    await link.should.have.textTooltip();
  });

  it('shows the form state', () => {
    testData.extendedForms.createPast(1, { state: 'closing' });
    return load('/projects/1/form-access').then(app => {
      const select = app.get('.project-form-access-row td:nth-child(2) select');
      select.element.value.should.equal('closing');
    });
  });

  describe('app user access', () => {
    it('shows app user access', () => {
      testData.extendedProjects.createPast(1, { forms: 1, appUsers: 2 });
      testData.extendedForms.createPast(1, { xmlFormId: 'f' });
      testData.extendedFieldKeys.createPast(2);
      // Create an assignment for the second field key, which will be the first
      // field key shown in the table.
      testData.standardFormSummaryAssignments.createPast(1, {
        actorId: testData.extendedFieldKeys.last().id,
        role: 'app-user',
        xmlFormId: 'f'
      });
      return load('/projects/1/form-access').then(app => {
        const inputs = app.findAll('.project-form-access-row-access input');
        inputs.map(input => input.element.checked).should.eql([true, false]);
      });
    });

    it('does not show an app user without a token', () => {
      testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
      testData.extendedForms.createPast(1, { xmlFormId: 'f' });
      testData.extendedFieldKeys.createPast(1, { token: null });
      testData.standardFormSummaryAssignments.createPast(1, {
        actorId: testData.extendedFieldKeys.last().id,
        role: 'app-user',
        xmlFormId: 'f'
      });
      return load('/projects/1/form-access').then(app => {
        app.find('.project-form-access-row-access').exists().should.be.false;
      });
    });
  });
});
