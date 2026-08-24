import { nextTick } from 'vue';

import EntityUploadWarning from '../../../../src/components/entity/upload/warning.vue';
import EntityUploadWarnings from '../../../../src/components/entity/upload/warnings.vue';

import { mount } from '../../../util/lifecycle';

const mountComponent = (options) => mount(EntityUploadWarnings, options);

describe('EntityUploadWarnings', () => {
  it('shows missing properties', async () => {
    const component = mountComponent({
      props: { missingProperties: ['foo', 'bar'] }
    });
    // Wait for I18nList to render.
    await nextTick();

    const p = component.getComponent(EntityUploadWarning).findAll('p');
    p.length.should.equal(2);
    p[0].text().should.startWith('These properties are not included in your file');
    p[1].text().should.equal('foo, bar');
  });

  it('shows a warning for ragged rows', () => {
    const component = mountComponent({
      props: { raggedRows: [[1, 2]] }
    });
    const warning = component.getComponent(EntityUploadWarning);
    warning.text().should.startWith('Fewer columns were found than expected');
    expect(warning.props().ranges).to.eql([[1, 2]]);
  });

  it('shows a warning for a large cell', () => {
    const component = mountComponent({
      props: { largeCell: 1 }
    });
    const warning = component.getComponent(EntityUploadWarning);
    warning.text().should.startWith('Some cells are abnormally large');
    expect(warning.props().ranges).to.eql([[1, 1]]);
  });

  it('shows multiple warnings', () => {
    const component = mountComponent({
      props: { raggedRows: [[1, 2]], largeCell: 3 }
    });
    const warnings = component.findAllComponents(EntityUploadWarning);
    warnings.length.should.equal(2);
    const titles = warnings.map(warning => warning.get('p').text());
    titles[0].should.startWith('Fewer columns were found than expected');
    titles[1].should.startWith('Some cells are abnormally large');
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
