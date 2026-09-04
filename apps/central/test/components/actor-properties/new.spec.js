import ActorPropertiesNew from '../../../src/components/actor-properties/new.vue';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options = undefined) =>
  mount(ActorPropertiesNew, mergeMountOptions(options, {
    container: {
      requestData: testRequestData(['actorProperties'], {
        project: testData.extendedProjects.last(),
        actorProperties: testData.actorProperties.sorted()
      })
    }
  }));

describe('ActorPropertiesNew', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedProjects.createPast(1);
  });

  it('shows the + Add Property link by default', () => {
    const component = mountComponent();
    component.find('.add-property-link').exists().should.be.true;
    component.find('input').exists().should.be.false;
  });

  it('shows the form when the link is clicked', async () => {
    const component = mountComponent();
    await component.find('.add-property-link').trigger('click');
    component.find('input').exists().should.be.true;
    component.find('button[type="submit"]').text().should.equal('Add');
    component.find('button[type="button"]').text().should.equal('Cancel');
    component.find('.add-property-link').exists().should.be.false;
  });

  it('focuses the input when the link is clicked', async () => {
    const component = mountComponent({ attachTo: document.body });
    await component.find('.add-property-link').trigger('click');
    await component.vm.$nextTick();
    component.find('input').should.be.focused();
  });

  it('hides the form and restores the link after a property is added', async () => {
    const component = mountComponent();
    await component.find('.add-property-link').trigger('click');
    await component.find('input').setValue('region');
    await component.find('form').trigger('submit');
    component.find('input').exists().should.be.false;
    component.find('.add-property-link').exists().should.be.true;
  });

  it('hides the form and restores the link on cancel', async () => {
    const component = mountComponent();
    await component.find('.add-property-link').trigger('click');
    await component.find('button[type="button"]').trigger('click');
    component.find('input').exists().should.be.false;
    component.find('.add-property-link').exists().should.be.true;
  });

  describe('validation', () => {
    beforeEach(() => {
      testData.actorProperties.createPast(1, { name: 'region' });
    });

    [
      ['123'],
      ['name'],
      ['displayName'],
      ['region'],
      ['REGION']
    ].forEach(name => {
      it(`shows an error for a property of '${name}'`, async () => {
        const component = mountComponent();
        await component.get('.add-property-link').trigger('click');
        await component.get('input').setValue(name);
        component.find('.property-input-error').exists().should.be.true;
      });
    });

    it('shows an error for two identical new properties', async () => {
      const component = mountComponent();

      await component.get('.add-property-link').trigger('click');
      await component.get('input').setValue('prop1');
      component.find('.property-input-error').exists().should.be.false;
      await component.get('form').trigger('submit');

      await component.get('.add-property-link').trigger('click');
      await component.get('input').setValue('prop1');
      component.find('.property-input-error').exists().should.be.true;
    });
  });
});
