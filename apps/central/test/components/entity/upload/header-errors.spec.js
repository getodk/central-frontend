import EntityUploadHeaderErrors from '../../../../src/components/entity/upload/header-errors.vue';

import testData from '../../../data';
import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options) =>
  mount(EntityUploadHeaderErrors, mergeMountOptions(options, {
    props: { filename: 'my_data.csv', delimiter: ',' },
    container: {
      requestData: { dataset: testData.extendedDatasets.last() }
    }
  }));

describe('EntityUploadHeaderErrors', () => {
  describe('expected header', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'height' }]
      });
    });

    it('shows the expected header', () => {
      const component = mountComponent({
        props: { header: 'height', missingLabel: true }
      });
      component.get('dd').text().should.equal('label,height');
    });

    it('uses the delimiter from the CSV file', () => {
      const component = mountComponent({
        props: { header: 'height', delimiter: ';', missingLabel: true }
      });
      component.get('dd').text().should.equal('label;height');
    });
  });

  describe('suggestions', () => {
    describe('delimiter is not a comma', () => {
      beforeEach(() => {
        testData.extendedDatasets.createPast(1, {
          properties: [{ name: 'height' }, { name: 'circumference' }]
        });
      });

      it('shows a suggestion if the delimiter is not a comma', () => {
        const component = mountComponent({
          props: {
            header: 'height;circumference',
            delimiter: ';',
            missingLabel: true
          }
        });
        const p = component.get('.entity-upload-header-errors-suggestions p:last-child');
        p.text().should.endWith('We used ;.');
      });

      it('shows ⇥ for tab', () => {
        const component = mountComponent({
          props: {
            header: 'height\tcircumference',
            delimiter: '\t',
            missingProperty: true
          }
        });
        const p = component.get('.entity-upload-header-errors-suggestions p:last-child');
        p.get('code').text().should.equal('⇥');
      });
    });
  });
});
