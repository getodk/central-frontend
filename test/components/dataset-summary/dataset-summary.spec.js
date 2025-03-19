import DatasetSummary from '../../../src/components/dataset/summary.vue';

import useForm from '../../../src/request-data/form';

import Property from '../../util/ds-property-enum';
import testData from '../../data';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const getContainer = () => ({
  router: mockRouter(),
  requestData: testRequestData([useForm], {
    formDraftDatasetDiff: testData.formDraftDatasetDiffs.sorted(),
    formDatasetDiff: testData.formDatasetDiffs.sorted()
  })
});

describe('DatasetSummary', () => {
  const theories = [0, 1, 2];

  theories.forEach(count => {
    it(`renders ${count} datasets for draft form`, () => {
      testData.formDraftDatasetDiffs.createPast(count, { isNew: true, properties: [Property.NewProperty] });
      const component = mount(DatasetSummary, {
        props: { isDraft: true },
        global: {
          provide: { projectId: '1', xmlFormId: 'simple' }
        },
        container: getContainer()
      });
      if (count === 0) {
        component.text().should.be.empty;
      } else {
        component.findAll('.dataset-name').length.should.be.equal(count);
      }
    });
  });

  theories.forEach(count => {
    it(`renders ${count} datasets for published form`, () => {
      testData.formDatasetDiffs.createPast(count, { properties: [Property.DefaultProperty] });
      const component = mount(DatasetSummary, {
        props: { isDraft: false },
        global: {
          provide: { projectId: '1', xmlFormId: 'simple' }
        },
        container: getContainer()
      });
      if (count === 0) {
        component.text().should.be.empty;
      } else {
        component.findAll('.dataset-name').length.should.be.equal(count);
      }
    });
  });
});
