import Project from '../../src/presenters/project';
import testData from '../data';

describe('Project', () => {
  describe('nameWithArchived()', () => {
    it("returns the project's name if the project is not archived", () => {
      const project = testData.extendedProjects.createNew({
        name: 'My Project'
      });
      new Project(project).nameWithArchived().should.equal('My Project');
    });

    it('appends (archived) if the project is archived', () => {
      const project = testData.extendedProjects
        .createPast(1, { name: 'My Project', archived: true })
        .last();
      new Project(project).nameWithArchived().should.equal('My Project (archived)');
    });
  });
});
