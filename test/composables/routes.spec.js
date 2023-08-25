import useRoutes from '../../src/composables/routes';

import createTestContainer from '../util/container';
import testData from '../data';
import { mockLogin } from '../util/session';
import { mockRouter } from '../util/router';
import { withSetup } from '../util/lifecycle';

describe('useRoutes()', () => {
  describe('projectPath', () => {
    it('returns a path if given a numeric id and suffix', () => {
      const container = createTestContainer({ router: mockRouter('/') });
      const { projectPath } = withSetup(useRoutes, { container });
      projectPath(1, 'settings').should.equal('/projects/1/settings');
    });

    it('returns a path if given a string id and suffix', () => {
      const container = createTestContainer({ router: mockRouter('/') });
      const { projectPath } = withSetup(useRoutes, { container });
      projectPath('1', 'settings').should.equal('/projects/1/settings');
    });

    it('returns a path if given only a numeric id', () => {
      const container = createTestContainer({ router: mockRouter('/') });
      const { projectPath } = withSetup(useRoutes, { container });
      projectPath(1).should.equal('/projects/1');
    });

    it('infers the id if given only a suffix', () => {
      const container = createTestContainer({
        router: mockRouter('/projects/2/app-users')
      });
      const { projectPath } = withSetup(useRoutes, { container });
      projectPath('settings').should.equal('/projects/2/settings');
    });

    it('infers the id if given no arguments', () => {
      const container = createTestContainer({
        router: mockRouter('/projects/2/app-users')
      });
      const { projectPath } = withSetup(useRoutes, { container });
      projectPath().should.equal('/projects/2');
    });
  });

  describe('formPath', () => {
    it('returns a path if given three arguments', () => {
      const container = createTestContainer({ router: mockRouter('/') });
      const { formPath } = withSetup(useRoutes, { container });
      formPath(1, 'f', 'settings').should.equal('/projects/1/forms/f/settings');
    });

    it('returns a path if given two arguments', () => {
      const container = createTestContainer({ router: mockRouter('/') });
      const { formPath } = withSetup(useRoutes, { container });
      formPath(1, 'f').should.equal('/projects/1/forms/f');
    });

    it('infers the ids if given one argument', () => {
      const container = createTestContainer({
        router: mockRouter('/projects/2/forms/g/submissions')
      });
      const { formPath } = withSetup(useRoutes, { container });
      formPath('settings').should.equal('/projects/2/forms/g/settings');
    });

    it('infers the ids if given no arguments', () => {
      const container = createTestContainer({
        router: mockRouter('/projects/2/forms/g/submissions')
      });
      const { formPath } = withSetup(useRoutes, { container });
      formPath().should.equal('/projects/2/forms/g');
    });

    it('encodes the form ID', () => {
      const container = createTestContainer({ router: mockRouter('/') });
      const { formPath } = withSetup(useRoutes, { container });
      formPath(1, 'a b').should.equal('/projects/1/forms/a%20b');
    });
  });

  describe('userPath', () => {
    it('returns a path if given an id', () => {
      const container = createTestContainer({ router: mockRouter('/') });
      const { userPath } = withSetup(useRoutes, { container });
      userPath(1).should.equal('/users/1/edit');
    });
  });

  describe('publishedFormPath', () => {
    it('returns form overview URL when user can route', () => {
      mockLogin({ role: 'admin' });
      const project = testData.extendedProjects.createNew();
      const container = createTestContainer({
        router: mockRouter('/projects/1'),
        requestData: { project }
      });
      const { publishedFormPath } = withSetup(useRoutes, { container });
      publishedFormPath(1, 'f').should.equal('/projects/1/forms/f');
    });

    it('returns submissions page URL when user can not route', () => {
      mockLogin({ role: 'none' });
      const project = testData.extendedProjects.createNew({ role: 'viewer' });
      const container = createTestContainer({
        router: mockRouter('/projects/1'),
        requestData: { project }
      });
      const { publishedFormPath } = withSetup(useRoutes, { container });
      publishedFormPath(1, 'f').should.equal('/projects/1/forms/f/submissions');
    });
  });

  describe('submissionPath()', () => {
    it('returns a path if given IDs', () => {
      const container = createTestContainer({ router: mockRouter('/') });
      const { submissionPath } = withSetup(useRoutes, { container });
      const path = submissionPath(1, 'a b', 'c d');
      path.should.equal('/projects/1/forms/a%20b/submissions/c%20d');
    });
  });

  describe('datasetPath()', () => {
    it('returns a path if given three arguments', () => {
      const container = createTestContainer({ router: mockRouter('/') });
      const { datasetPath } = withSetup(useRoutes, { container });
      const path = datasetPath(1, 'trees', 'entities');
      path.should.equal('/projects/1/entity-lists/trees/entities');
    });

    it('returns a path if given two arguments', () => {
      const container = createTestContainer({ router: mockRouter('/') });
      const { datasetPath } = withSetup(useRoutes, { container });
      datasetPath(1, 'trees').should.equal('/projects/1/entity-lists/trees');
    });

    it('infers projectId and datasetName if given one argument', () => {
      const container = createTestContainer({
        router: mockRouter('/projects/1/entity-lists/trees')
      });
      const { datasetPath } = withSetup(useRoutes, { container });
      const path = datasetPath('entities');
      path.should.equal('/projects/1/entity-lists/trees/entities');
    });

    it('infers projectId and datasetName if given no arguments', () => {
      const container = createTestContainer({
        router: mockRouter('/projects/1/entity-lists/trees/entities')
      });
      const { datasetPath } = withSetup(useRoutes, { container });
      datasetPath().should.equal('/projects/1/entity-lists/trees');
    });

    it('encodes the dataset name', () => {
      const container = createTestContainer({ router: mockRouter('/') });
      const { datasetPath } = withSetup(useRoutes, { container });
      datasetPath(1, 'á').should.equal('/projects/1/entity-lists/%C3%A1');
    });
  });

  describe('entityPath()', () => {
    it('returns a path if given IDs', () => {
      const container = createTestContainer({ router: mockRouter('/') });
      const { entityPath } = withSetup(useRoutes, { container });
      const path = entityPath(1, 'a b', 'abcd1234');
      path.should.equal('/projects/1/entity-lists/a%20b/entities/abcd1234');
    });
  });
});
