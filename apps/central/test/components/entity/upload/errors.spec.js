import { nextTick } from 'vue';

import EntityUploadErrors from '../../../../src/components/entity/upload/errors.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options) =>
  mount(EntityUploadErrors, mergeMountOptions(options, {
    props: { delimiter: ',' }
  }));

describe('EntityUploadErrors', () => {
  describe('delimiter is not a comma', () => {
    it('shows a note', () => {
      const component = mountComponent({
        props: { delimiter: ';', missingLabel: true }
      });
      component.get('p:nth-child(3)').text().should.endWith('We used ;.');
    });

    it('shows ⇥ for tab', () => {
      const component = mountComponent({
        props: { delimiter: '\t', missingLabel: true }
      });
      component.get('p:nth-child(3) code').text().should.equal('⇥');
    });
  });

  // Boolean error props
  [
    ['invalidQuotes', 'A quoted field is invalid in the header row'],
    ['missingLabel', 'A label property is required'],
    ['emptyColumn', 'Empty cell in header row']
  ].forEach(([prop, title]) => {
    it(`shows an error if the ${prop} prop is true`, () => {
      const component = mountComponent({
        props: { [prop]: true }
      });
      const p = component.get('.entity-upload-alert').findAll('p');
      p.length.should.equal(2);
      p[0].text().should.equal(title);
    });
  });

  it('shows an error if there are duplicate column headers', async () => {
    const component = mountComponent({
      props: { duplicateColumns: ['height', 'species'] }
    });
    // Wait for I18nList to render.
    await nextTick();

    const p = component.get('.entity-upload-alert').findAll('p');
    p.length.should.equal(3);
    p[0].text().should.equal('Duplicate column headers');
    p[2].text().should.equal('height, species');
  });

  it('shows a data error', () => {
    const component = mountComponent({
      props: { dataError: 'Such and such details' }
    });
    const p = component.findAll('.entity-upload-alert p');
    p.length.should.equal(2);
    p[0].text().should.equal('Data error');
    p[1].text().should.equal('Such and such details');
  });
});
