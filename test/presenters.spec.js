import createTestContainer from './util/container';
import testData from './data';

describe('subclassPresenters()', () => {
  it('defines a from() method', () => {
    const { i18n, Project } = createTestContainer();
    const data = testData.extendedProjects.createNew();
    const presenter = Project.from(data);
    presenter.should.be.an.instanceof(Project);
    presenter.object.should.equal(data);
    presenter.i18n.should.equal(i18n);
  });

  it('binds from() to the class', () => {
    const { Project } = createTestContainer();
    const { from } = Project;
    const presenter = from(testData.extendedProjects.createNew());
    presenter.should.be.an.instanceof(Project);
  });
});
