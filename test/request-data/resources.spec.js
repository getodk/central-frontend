import createTestContainer from '../util/container';
import testData from '../data';

describe('createResources()', () => {
  describe('config', () => {
    const createResource = (config) => {
      const { requestData } = createTestContainer({
        requestData: { config }
      });
      return requestData.config;
    };

    it('merges the response with the defaults', () => {
      const config = createResource({
        home: { title: 'Some Title' }
      });
      // Make assertions about a top-level property and a nested property.
      config.data.should.containEql({
        oidcEnabled: false,
        // `body` is still present even though the response returned `home`
        // without `body`.
        home: { title: 'Some Title', body: null }
      });
    });

    it('falls back to the defaults for completely invalid JSON', () => {
      createResource('{]').data.should.containEql({ oidcEnabled: false });
    });

    it('falls back to the defaults for a JSON number', () => {
      createResource(1).data.should.containEql({ oidcEnabled: false });
    });
  });

  describe('project', () => {
    const createResource = () => {
      const { requestData } = createTestContainer({
        requestData: { project: testData.extendedProjects.last() }
      });
      return requestData.project;
    };

    describe('nameWithArchived', () => {
      it("sets it to the project's name if the project is not archived", () => {
        testData.extendedProjects.createNew({ name: 'My Project' });
        createResource().nameWithArchived.should.equal('My Project');
      });

      it('appends (archived) if the project is archived', () => {
        testData.extendedProjects.createPast(1, {
          name: 'My Project',
          archived: true
        });
        createResource().nameWithArchived.should.equal('My Project (archived)');
      });
    });
  });

  describe('form', () => {
    const createResource = () => {
      const { requestData } = createTestContainer({
        requestData: { form: testData.extendedForms.last() }
      });
      return requestData.form;
    };

    describe('nameOrId', () => {
      it("sets it to the form's name if the form has one", () => {
        testData.extendedForms.createNew({ name: 'My Form' });
        createResource().nameOrId.should.equal('My Form');
      });

      it('sets it to the xmlFormId if the form does not have a name', () => {
        testData.extendedForms.createNew({ name: null });
        createResource().nameOrId.should.equal('f');
      });
    });
  });
});
