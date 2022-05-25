import sortFunctions from '../../src/util/sort';
import { ago } from '../../src/util/date-time';
import Form from '../../src/presenters/form';

import testData from '../data';

describe('util/sort', () => {
  it('has the expected sort functions', () => {
    Object.keys(sortFunctions).should.eql(['alphabetical', 'latest', 'newest']);
  });

  describe('sort forms', () => {
    beforeEach(() => {
      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(1, { name: 'C', lastSubmission: ago({ days: 15 }).toISO() });
      testData.extendedForms.createPast(1, { name: 'D', lastSubmission: ago({ days: 20 }).toISO() });
      testData.extendedForms.createPast(1, { name: 'E', lastSubmission: ago({ days: 10 }).toISO() });
      testData.extendedForms.createPast(1, { name: 'A' });
      testData.extendedForms.createPast(1, { name: 'B' });
    });

    it('can sort forms by latest submission including breaking ties (null submissions) alphabetically', () => {
      const forms = testData.extendedForms.sorted();
      forms.sort(sortFunctions.latest);
      forms.map((form) => form.name).should.eql(['E', 'C', 'D', 'A', 'B']);
    });

    it('can sort forms alphabetically', () => {
      const forms = testData.extendedForms.sorted();
      forms.sort(sortFunctions.alphabetical);
      forms.map((form) => form.name).should.eql(['A', 'B', 'C', 'D', 'E']);
    });

    it('can sort forms by newest creation', () => {
      const forms = testData.extendedForms.sorted();
      forms.sort(sortFunctions.newest);
      forms.map((form) => form.name).should.eql(['B', 'A', 'E', 'D', 'C']);
    });
  });

  it('can sort forms by name and xmlFormId if name is null', () => {
    const forms = [];
    forms.push(new Form({ name: null, xmlFormId: 'a_id' }));
    forms.push(new Form({ name: 'B', xmlFormId: 'name_b' }));
    forms.push(new Form({ name: null, xmlFormId: 'c_id' }));
    forms.sort(sortFunctions.alphabetical);
    forms.map((form) => form.xmlFormId).should.eql(['a_id', 'name_b', 'c_id']);
  });

  describe('sort projects', () => {
    beforeEach(() => {
      testData.extendedProjects.createPast(1, { name: 'A', lastSubmission: ago({ days: 15 }).toISO() });
      testData.extendedProjects.createPast(1, { name: 'D', lastSubmission: ago({ days: 10 }).toISO() });
      testData.extendedProjects.createPast(1, { name: 'B' });
      testData.extendedProjects.createPast(1, { name: 'C' });
    });

    it('can sort projects by latest submission including breaking ties (null submissions) alphabetically', () => {
      const projects = testData.extendedProjects.sorted();
      projects.sort(sortFunctions.latest);
      projects.map((project) => project.name).should.eql(['D', 'A', 'B', 'C']);
    });

    it('can sort projects alphabetically', () => {
      const projects = testData.extendedProjects.sorted();
      projects.sort(sortFunctions.alphabetical);
      projects.map((project) => project.name).should.eql(['A', 'B', 'C', 'D']);
    });

    it('can sort projects by newest creation date', () => {
      const projects = testData.extendedProjects.sorted();
      projects.sort(sortFunctions.newest);
      projects.map((project) => project.name).should.eql(['C', 'B', 'D', 'A']);
    });
  });
});
