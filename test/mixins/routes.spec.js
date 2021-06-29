import routes from '../../src/mixins/routes';

const mixin = routes();
const component = {
  $route: {
    params: {
      projectId: 2,
      xmlFormId: 'g'
    }
  }
};

describe('mixins/routes', () => {
  describe('projectPath', () => {
    const projectPath = mixin.methods.projectPath.bind(component);

    it('returns a path if given a numeric id and suffix', () => {
      projectPath(1, 'settings').should.equal('/projects/1/settings');
    });

    it('returns a path if given a string id and suffix', () => {
      projectPath('1', 'settings').should.equal('/projects/1/settings');
    });

    it('returns a path if given only a numeric id', () => {
      projectPath(1).should.equal('/projects/1');
    });

    it('infers the id if given only a suffix', () => {
      projectPath('settings').should.equal('/projects/2/settings');
    });

    it('infers the id if given no arguments', () => {
      projectPath().should.equal('/projects/2');
    });
  });

  describe('formPath', () => {
    const formPath = mixin.methods.formPath.bind(component);

    it('returns a path if given three arguments', () => {
      formPath(1, 'f', 'settings').should.equal('/projects/1/forms/f/settings');
    });

    it('returns a path if given two arguments', () => {
      formPath(1, 'f').should.equal('/projects/1/forms/f');
    });

    it('infers the ids if given one argument', () => {
      formPath('settings').should.equal('/projects/2/forms/g/settings');
    });

    it('infers the ids if given no arguments', () => {
      formPath().should.equal('/projects/2/forms/g');
    });

    it('encodes the form ID', () => {
      formPath(1, 'a b').should.equal('/projects/1/forms/a%20b');
    });
  });

  describe('userPath', () => {
    it('returns a path if given an id', () => {
      mixin.methods.userPath(1).should.equal('/users/1/edit');
    });
  });
});
