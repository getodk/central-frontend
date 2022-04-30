import i18n from '../../src/i18n';
import subclassPresenters from '../../src/presenters';

import testData from '../data';

const { Project } = subclassPresenters(i18n);

describe('Project', () => {
  describe('nameWithArchived()', () => {
    it("returns the project's name if the project is not archived", () => {
      const project = testData.extendedProjects.createNew({
        name: 'My Project'
      });
      Project.from(project).nameWithArchived().should.equal('My Project');
    });

    it('appends (archived) if the project is archived', () => {
      const project = testData.extendedProjects
        .createPast(1, { name: 'My Project', archived: true })
        .last();
      Project.from(project).nameWithArchived().should.equal('My Project (archived)');
    });
  });
});
