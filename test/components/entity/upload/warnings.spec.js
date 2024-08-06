import EntityUploadWarning from '../../../../src/components/entity/upload/warning.vue';
import EntityUploadWarnings from '../../../../src/components/entity/upload/warnings.vue';

import { mount } from '../../../util/lifecycle';

const mountComponent = (options) => mount(EntityUploadWarnings, options);

describe('EntityUploadWarnings', () => {
  it('shows a warning for ragged rows', () => {
    const component = mountComponent({
      props: { raggedRows: [[1, 2]] }
    });
    const warning = component.getComponent(EntityUploadWarning);
    warning.text().should.include('Fewer columns were found than expected');
    expect(warning.props().ranges).to.eql([[1, 2]]);
  });

  it('shows a warning for a large cell', () => {
    const component = mountComponent({
      props: { largeCell: 1 }
    });
    const warning = component.getComponent(EntityUploadWarning);
    warning.text().should.include('Some cells are abnormally large');
    expect(warning.props().ranges).to.eql([[1, 1]]);
  });

  it('shows multiple warnings', () => {
    const component = mountComponent({
      props: { raggedRows: [[1, 2]], largeCell: 3 }
    });
    const warnings = component.findAllComponents(EntityUploadWarning);
    warnings.length.should.equal(2);
    const text = warnings.map(warning => warning.text());
    text[0].should.include('Fewer columns were found than expected');
    text[1].should.include('Some cells are abnormally large');
  });

  it('emits a rows event after a row range is clicked', async () => {
    const component = mountComponent({
      props: { raggedRows: [[1, 2]], largeCell: 3 }
    });
    const warnings = component.findAllComponents(EntityUploadWarning);
    warnings.length.should.equal(2);
    await warnings[0].get('a').trigger('click');
    await warnings[1].get('a').trigger('click');
    component.emitted().rows.should.eql([[[0, 1]], [[2, 2]]]);
  });
});
