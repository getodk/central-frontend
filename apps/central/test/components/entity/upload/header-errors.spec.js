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
        props: { header: 'label', missingProperty: true }
      });
      component.get('dd').text().should.equal('label,height');
    });

    it('uses the delimiter from the CSV file', () => {
      const component = mountComponent({
        props: { header: 'label', delimiter: ';', missingProperty: true }
      });
      component.get('dd').text().should.equal('label;height');
    });
  });

  describe('suggestions', () => {
    const getSuggestion = (component) => {
      const p = component.findAll('.entity-upload-header-errors-suggestions p');
      p.length.should.equal(1);
      return p[0];
    };

    it('does not show a suggestion for a missing property', () => {
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'height' }]
      });
      const component = mountComponent({
        props: { header: 'label', missingProperty: true }
      });
      component.find('.entity-upload-header-errors-suggestions').exists().should.be.false;
    });

    describe('delimiter is not a comma', () => {
      beforeEach(() => {
        testData.extendedDatasets.createPast(1, {
          properties: [{ name: 'height' }, { name: 'circumference' }]
        });
      });

      it('shows a suggestion if the delimiter is not a comma', () => {
        const component = mountComponent({
          props: {
            header: 'label;height',
            delimiter: ';',
            missingProperty: true
          }
        });
        getSuggestion(component).text().should.endWith('We used ;.');
      });

      it('shows ⇥ for tab', () => {
        const component = mountComponent({
          props: {
            header: 'label\theight',
            delimiter: '\t',
            missingProperty: true
          }
        });
        getSuggestion(component).get('code').text().should.equal('⇥');
      });
    });
  });
});
