import Form from '../../src/presenters/form';
import testData from '../data';

describe('Form', () => {
  describe('nameOrId()', () => {
    it("returns the form's name if the form has one", () => {
      const form = testData.extendedForms.createNew({ name: 'My Form' });
      new Form(form).nameOrId().should.equal('My Form');
    });

    it('returns the xmlFormId if the form does not have a name', () => {
      const form = testData.extendedForms.createNew({ name: null });
      new Form(form).nameOrId().should.equal('f');
    });
  });

  describe('versionOrBlank()', () => {
    it('returns the version property if it is a non-empty string', () => {
      const form = testData.extendedForms.createPast(1).last();
      new Form(form).versionOrBlank().should.equal('v1');
    });

    it("returns '(blank)' if the version property is an empty string", () => {
      const form = testData.extendedForms.createPast(1, { version: '' }).last();
      new Form(form).versionOrBlank().should.equal('(blank)');
    });

    it('returns null if the form does not have a version property', () => {
      const form = testData.extendedForms.createPast(1, { draft: true }).last();
      should.not.exist(new Form(form).versionOrBlank());
    });
  });

  describe('updatedOrCreatedAt()', () => {
    it('returns updatedAt if the form has been updated', () => {
      const form = testData.extendedForms
        .createPast(1, { state: 'open' })
        .update(-1, { state: 'closed' });
      new Form(form).updatedOrCreatedAt().should.equal(form.updatedAt);
    });

    it('returns createdAt if the form has not been updated', () => {
      const form = testData.extendedForms.createNew();
      new Form(form).updatedOrCreatedAt().should.equal(form.createdAt);
    });
  });
});
