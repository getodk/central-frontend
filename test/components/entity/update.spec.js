import EntityUpdate from '../../../src/components/entity/update.vue';
import EntityUpdateRow from '../../../src/components/entity/update/row.vue';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockHttp } from '../../util/http';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  props: { state: true, entity: testData.extendedEntities.last() },
  container: {
    requestData: { dataset: testData.extendedDatasets.last() }
  }
});
const mountComponent = (options = undefined) =>
  mount(EntityUpdate, mountOptions(options));

describe('EntityUpdate', () => {
  it('shows the entity label in the title', () => {
    testData.extendedEntities.createPast(1, { label: 'My Entity' });
    const text = mountComponent().get('.modal-title').text();
    text.should.equal('Update My Entity');
  });

  describe('input of entity label', () => {
    beforeEach(() => {
      testData.extendedEntities.createPast(1, { label: 'My Entity' });
    });

    it('renders a row for the label', () => {
      const row = mountComponent().getComponent(EntityUpdateRow);
      row.props().label.should.equal('Entity Label');
      row.props().oldValue.should.equal('My Entity');
      should.not.exist(row.props().modelValue);
    });

    it('updates the modelValue prop after input', async () => {
      const row = mountComponent().getComponent(EntityUpdateRow);
      await row.get('textarea').setValue('Updated Entity');
      row.props().modelValue.should.equal('Updated Entity');
    });
  });

  describe('input of entity data', () => {
    beforeEach(() => {
      testData.extendedEntities.createPast(1, {
        data: { height: '1', circumference: '2' }
      });
    });

    it('renders a row for each dataset property', () => {
      const rows = mountComponent().findAllComponents(EntityUpdateRow);
      rows.length.should.equal(3);
    });

    it('passes the correct props to the row', () => {
      const row = mountComponent().findAllComponents(EntityUpdateRow)[1];
      row.props().label.should.equal('height');
      row.props().oldValue.should.equal('1');
      should.not.exist(row.props().modelValue);
    });

    it('updates the modelValue prop after input', async () => {
      const row = mountComponent().findAllComponents(EntityUpdateRow)[1];
      await row.get('textarea').setValue('3');
      row.props().modelValue.should.equal('3');
    });
  });

  it('focuses the entity label textarea', () => {
    testData.extendedEntities.createPast(1);
    const modal = mountComponent({ attachTo: document.body });
    modal.get('textarea').should.be.focused();
  });

  it('makes width of current and updated values nearly equal', async () => {
    testData.extendedEntities.createPast(1);
    const modal = mountComponent({ attachTo: document.body });
    await modal.vm.$nextTick();
    const widths = modal.findAll('th.old-value, th.new-value')
      .map(th => th.element.getBoundingClientRect().width);
    // The left + right padding of the textarea is 24px.
    (widths[1] - widths[0]).should.be.within(23.9, 24.1);
  });

  it('resizes the textarea elements', async () => {
    testData.extendedEntities.createPast(1, {
      data: { height: '1' }
    });
    const modal = mountComponent({
      props: { state: false },
      attachTo: document.body
    });
    const textareas = modal.findAll('textarea');
    textareas.map(({ element }) => element.style.height).should.eql(['', '']);
    await modal.setProps({ state: true });
    await modal.vm.$nextTick();
    const heights = textareas.map(({ element }) => element.style.height);
    heights[0].should.not.equal('');
    heights[1].should.not.equal('');
  });

  it('resets the form after the modal is hidden', async () => {
    testData.extendedEntities.createPast(1, {
      label: 'My Entity',
      data: { height: '1' }
    });
    const modal = mountComponent();
    const rows = modal.findAllComponents(EntityUpdateRow);
    await rows[0].get('textarea').setValue('Updated Entity');
    await rows[1].get('textarea').setValue('2');
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    should.not.exist(rows[0].props().modelValue);
    should.not.exist(rows[1].props().modelValue);
  });

  it('sends the correct request', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'á',
      properties: [{ name: 'height' }],
      entities: 1
    });
    testData.extendedEntities.createPast(1, {
      uuid: 'e',
      label: 'My Entity',
      version: 1,
      data: { height: '1' }
    });
    return mockHttp()
      .mount(EntityUpdate, mountOptions())
      .request(async (modal) => {
        const textareas = modal.findAll('textarea');
        await textareas[0].setValue('Updated Entity');
        await textareas[1].setValue('2');
        return modal.get('form').trigger('submit');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'PATCH',
        url: '/v1/projects/1/datasets/%C3%A1/entities/e',
        data: {
          label: 'Updated Entity',
          data: Object.assign(Object.create(null), { height: '2' })
        },
        headers: {
          'If-Match': '"1"'
        }
      }]);
  });

  it('does not send values that have not changed', () => {
    testData.extendedEntities.createPast(1, {
      data: { height: '1' }
    });
    return mockHttp()
      .mount(EntityUpdate, mountOptions())
      .request(modal => modal.get('form').trigger('submit'))
      .beforeEachResponse((_, { data }) => {
        data.should.eql({ label: undefined, data: Object.create(null) });
      })
      .respondWithProblem();
  });

  it('does not send values that have been changed, then changed back', () => {
    testData.extendedEntities.createPast(1, {
      label: 'My Entity',
      data: { height: '1' }
    });
    return mockHttp()
      .mount(EntityUpdate, mountOptions())
      .request(async (modal) => {
        const textareas = modal.findAll('textarea');
        await textareas[0].setValue('Updated Entity');
        await textareas[0].setValue('My Entity');
        await textareas[1].setValue('2');
        await textareas[1].setValue('1');
        return modal.get('form').trigger('submit');
      })
      .beforeEachResponse((_, { data }) => {
        data.should.eql({
          label: undefined,
          data: Object.assign(Object.create(null), { height: undefined })
        });
      })
      .respondWithProblem();
  });

  it('does not send a property that did not exist, then was changed, then was changed again to be empty', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }],
      entities: 1
    });
    testData.extendedEntities.createPast(1, { data: {} });
    return mockHttp()
      .mount(EntityUpdate, mountOptions())
      .request(async (modal) => {
        const textarea = modal.findAll('textarea')[1];
        await textarea.setValue('1');
        await textarea.setValue('');
        return modal.get('form').trigger('submit');
      })
      .beforeEachResponse((_, { data }) => {
        data.should.eql({
          label: undefined,
          data: Object.assign(Object.create(null), { height: undefined })
        });
      })
      .respondWithProblem();
  });

  it('implements some standard button things', () => {
    testData.extendedEntities.createPast(1);
    return mockHttp()
      .mount(EntityUpdate, mountOptions())
      .testStandardButton({
        button: 'button[type="submit"]',
        request: (modal) => modal.get('form').trigger('submit'),
        disabled: ['.btn-link'],
        modal: true
      });
  });

  it('emits a success event after a successful response', () => {
    testData.extendedEntities.createPast(1, {
      label: 'My Entity',
      data: { height: '1' }
    });
    return mockHttp()
      .mount(EntityUpdate, mountOptions())
      .request(async (modal) => {
        const textareas = modal.findAll('textarea');
        await textareas[0].setValue('Updated Entity');
        await textareas[1].setValue('2');
        return modal.get('form').trigger('submit');
      })
      .respondWithData(() => {
        const { currentVersion } = testData.extendedEntities.last();
        testData.extendedEntities.update(-1, {
          currentVersion: {
            ...currentVersion,
            label: 'Updated Entity',
            data: { height: '2' }
          }
        });
        return testData.standardEntities.last();
      })
      .afterResponse(modal => {
        const updated = testData.standardEntities.last();
        modal.emitted('success').should.eql([[updated]]);
      });
  });

  it('shows conflict error', () => {
    testData.extendedEntities.createPast(1, {
      label: 'My Entity',
      data: { height: '1' }
    });
    return mockHttp()
      .mount(EntityUpdate, mountOptions())
      .request(async (modal) => {
        const textareas = modal.findAll('textarea');
        await textareas[0].setValue('Updated Entity');
        await textareas[1].setValue('2');
        return modal.get('form').trigger('submit');
      })
      .respondWithProblem(409.15)
      .afterResponse(component => {
        component.should.alert('danger', (message) => {
          message.should.eql('Data has been modified by another user. Please refresh to see the updated data.');
        });
      });
  });
});
