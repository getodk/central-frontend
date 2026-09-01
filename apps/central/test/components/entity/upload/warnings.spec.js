import { nextTick } from 'vue';

import EntityUploadAlert from '../../../../src/components/entity/upload/alert.vue';
import EntityUploadWarnings from '../../../../src/components/entity/upload/warnings.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options) =>
  mount(EntityUploadWarnings, mergeMountOptions(options, {
    props: { filename: 'my_data.csv', count: 1 }
  }));

describe('EntityUploadWarnings', () => {
  it('shows a warning for system properties', async () => {
    const component = mountComponent({
      props: { systemProperties: ['__id', '__foo'] }
    });
    // Wait for I18nList to render.
    await nextTick();

    const p = component.getComponent(EntityUploadAlert).findAll('p');
    p.length.should.equal(3);
    p[0].text().should.startWith('System properties can’t be set');
    p[2].text().should.equal('__id, __foo');
  });

  it('shows a warning for columns that differ from properties on letter case', async () => {
    const component = mountComponent({
      props: {
        caseMismatch: [
          { column: 'CIRCUMFERENCE', property: 'circumference' },
          { column: 'Species', property: 'species' }
        ]
      }
    });

    const warning = component.getComponent(EntityUploadAlert);
    const title = warning.get('p').text();
    title.should.startWith('Column is similar to an existing property');

    const table = warning.get('table');
    const th = table.get('th:last-child');
    th.text().should.equal('my_data.csv');
    await th.should.have.textTooltip();

    const tdText = table.findAll('tbody tr').map(tr =>
      tr.findAll('td').map(td => td.text()));
    tdText.should.eql([
      ['circumference', 'CIRCUMFERENCE'],
      ['species', 'Species']
    ]);
    await table.get('td').should.have.textTooltip();
  });

  it('shows a warning for columns that are invalid property names', async () => {
    const component = mountComponent({
      props: { invalidProperties: ['First name', 'phone#'] }
    });
    // Wait for I18nList to render.
    await nextTick();

    const p = component.getComponent(EntityUploadAlert).findAll('p');
    p.length.should.equal(3);
    p[0].text().should.equal('These columns are not valid property names');
    p[2].text().should.equal('First name, phone#');
  });

  it('shows a warning for missing properties', async () => {
    const component = mountComponent({
      props: { missingProperties: ['foo', 'bar'] }
    });
    // Wait for I18nList to render.
    await nextTick();

    const p = component.getComponent(EntityUploadAlert).findAll('p');
    p.length.should.equal(3);
    p[0].text().should.equal('Properties not found in file');
    p[2].text().should.equal('foo, bar');
  });

  describe('unknown properties', () => {
    it('shows a warning for unknown properties', () => {
      const component = mountComponent({
        props: { extraProperties: ['foo', 'bar'] }
      });
      const p = component.getComponent(EntityUploadAlert).findAll('p');
      p.length.should.equal(2);
      p[0].text().should.equal('These columns don’t match existing properties');
      p[1].text().should.startWith('Select which ones to create');
    });

    it('shows different text if there are errors', () => {
      const component = mountComponent({
        props: { extraProperties: ['foo', 'bar'], hasError: true }
      });
      const warning = component.getComponent(EntityUploadAlert);
      const text = warning.get('p:nth-child(2)').text();
      text.should.startWith('Once you’ve fixed all errors, you’ll be able to select');
    });
  });

  it('shows a warning for ragged rows', () => {
    const component = mountComponent({
      props: { raggedRows: [[1, 2]] }
    });
    const warning = component.getComponent(EntityUploadAlert);
    warning.text().should.startWith('Fewer columns were found than expected');
    expect(warning.props().ranges).to.eql([[1, 2]]);
  });

  it('shows a warning for a large cell', () => {
    const component = mountComponent({
      props: { largeCell: 1 }
    });
    const warning = component.getComponent(EntityUploadAlert);
    warning.text().should.startWith('Some cells are abnormally large');
    expect(warning.props().ranges).to.eql([[1, 1]]);
  });

  it('shows multiple warnings', () => {
    const component = mountComponent({
      props: { count: 2, raggedRows: [[1, 2]], largeCell: 3 }
    });
    const warnings = component.findAllComponents(EntityUploadAlert);
    warnings.length.should.equal(2);
    const titles = warnings.map(warning => warning.get('p').text());
    titles[0].should.startWith('Fewer columns were found than expected');
    titles[1].should.startWith('Some cells are abnormally large');
  });

  it('emits a rows event after a row range is clicked', async () => {
    const component = mountComponent({
      props: { count: 2, raggedRows: [[1, 2]], largeCell: 3 }
    });
    const warnings = component.findAllComponents(EntityUploadAlert);
    warnings.length.should.equal(2);
    await warnings[0].get('a').trigger('click');
    await warnings[1].get('a').trigger('click');
    component.emitted().rows.should.eql([[[0, 1]], [[2, 2]]]);
  });
});
