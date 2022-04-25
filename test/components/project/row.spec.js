import { RouterLinkStub } from '@vue/test-utils';

import DateTime from '../../../src/components/date-time.vue';
import ProjectRow from '../../../src/components/project/row.vue';

import Project from '../../../src/presenters/project';

import testData from '../../data';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(ProjectRow, {
  props: {
    project: new Project(testData.extendedProjects.last()),
    introduction: false
  },
  container: { router: mockRouter('/') }
});

describe('ProjectRow', () => {
  it('renders the project name correctly', () => {
    testData.extendedProjects.createPast(1, { name: 'My Project' });
    const link = mountComponent().getComponent(RouterLinkStub);
    link.text().should.equal('My Project');
    link.props().to.should.equal('/projects/1');
  });

  it('shows a lock icon for a project with managed encryption', () => {
    const key = testData.standardKeys.createPast(1, { managed: true }).last();
    testData.extendedProjects.createPast(1, { key });
    mountComponent().find('.icon-lock').exists().should.be.true();
  });

  it('shows the form count', () => {
    testData.extendedProjects.createPast(1, { forms: 2 });
    mountComponent().findAll('td')[1].text().should.equal('2 Forms');
  });

  describe('last submission date', () => {
    it('shows the date', () => {
      const now = new Date().toISOString();
      testData.extendedProjects.createPast(1, { lastSubmission: now });
      mountComponent().getComponent(DateTime).props().iso.should.equal(now);
    });

    it('shows (none) if there has been no submission', () => {
      testData.extendedProjects.createPast(1, { lastSubmission: null });
      mountComponent().findAll('td')[2].text().should.equal('(none)');
    });
  });

  describe('archived project', () => {
    it('adds an HTML class to the row', () => {
      testData.extendedProjects.createPast(1, { archived: true });
      mountComponent().classes('archived').should.be.true();
    });

    it("appends (archived) to the project's name", () => {
      testData.extendedProjects.createPast(1, {
        name: 'My Project',
        archived: true
      });
      const text = mountComponent().getComponent(RouterLinkStub).text();
      text.should.equal('My Project (archived)');
    });
  });
});
