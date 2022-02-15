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
