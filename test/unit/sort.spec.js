import sortFunctions from '../../src/util/sort';
import useProject from '../../src/request-data/project';
import { ago } from '../../src/util/date-time';

import createTestContainer from '../util/container';
import testData from '../data';
import { testRequestData } from '../util/request-data';

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
    testData.extendedForms
      .createPast(1, { name: null, xmlFormId: 'a_id' })
      .createPast(1, { name: 'B', xmlFormId: 'name_b' })
      .createPast(1, { name: null, xmlFormId: 'c_id' });
    const { requestData } = createTestContainer({
      requestData: testRequestData([useProject], {
        forms: testData.extendedForms.sorted()
      })
    });
    const { forms } = requestData.localResources;
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
