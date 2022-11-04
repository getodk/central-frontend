import DatasetSummary from '../../../src/components/dataset-summary/dataset-summary.vue';
import { PropertyEnum as Property } from "../../util/ds-property-enum";

import testData from '../../data';
import { mount } from '../../util/lifecycle';
import { mockRouter } from '../../util/router';

const getContainer = () => ({
    router: mockRouter(),
    requestData: { 
        formDraftDatasetDiff: testData.formDraftDatasetDiffs.sorted(),
        formDatasetDiff: testData.formDatasetDiffs.sorted()
    }
  });

describe('Dataset summary', () => {

    const theories = [0,1,2];

    theories.forEach(count => {
        it(`renders ${count} datasets for draft form`, () => {
            testData.formDraftDatasetDiffs.createPast(count, {isNew: true, properties: [Property.NewProperty]});
            const component = mount(DatasetSummary, {
              props: { isDraft: true },
              container: getContainer()
            });
            if(count == 0){
                component.text().should.be.empty();
            }
            else{
                component.get('.summary-item-heading').text().should.be.equal(count.toString());
                component.findAll('.dataset-name').length.should.be.equal(count);
            }
          });
    });

    theories.forEach(count => {
        it(`renders ${count} datasets for published form`, () => {
            testData.formDatasetDiffs.createPast(count, {properties: [Property.DefaultProperty]});
            const component = mount(DatasetSummary, {
              props: { isDraft: false },
              container: getContainer()
            });
            if(count == 0){
                component.text().should.be.empty();
            }
            else{
                component.get('.summary-item-heading').text().should.be.equal(count.toString());
                component.findAll('.dataset-name').length.should.be.equal(count);
            }
          });
    });
});
