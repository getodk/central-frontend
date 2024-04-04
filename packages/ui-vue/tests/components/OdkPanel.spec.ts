import OdkPanel from '@/components/OdkPanel.vue';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import { describe, expect, it } from 'vitest';

describe('OdkPanel', () => {
	it('does not render PrimeVue Panel if noUI is true', () => {
    const component = mount(OdkPanel, {
      props: {
        noUi: true
      }
    });

    expect(component.html()).to.be.empty;
  });

  it('does not render context button if there is no menu items', () => {
    const component = mount(OdkPanel, {
      props: {
        title: 'Test Panel'
      }
    });

    expect(component.find('.btn-context').exists()).to.be.false;
  });

  it('shows title', () => {
    const component = mount(OdkPanel, {
      props: {
        title: 'Test Panel'
      }
    });

    expect(component.find('.panel-title').text()).to.be.eql('Test Panel');
  })

  it('shows provided menu items in context menu', async () => {
    const component = mount(OdkPanel, {
      props: {
        title: 'Test Panel',
        menuItems: [{label: 'Remove', icon: 'icon-delete'}]
      },
      global: {
        plugins: [[PrimeVue, { ripple: false }]],
        stubs: {
          teleport: true
        }
      }
    });

    await component.find('.btn-context').trigger('click');

    expect(component.findAll('.p-menu.p-component li').length).to.be.eql(1);
    expect(component.find('.p-menu.p-component').text()).to.be.eql('Remove');
  });
});