import { RouterLinkStub } from '@vue/test-utils';

import DatasetLink from '../../../src/components/dataset/link.vue';

import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockRouter } from '../../util/router';

const mountComponent = (options = undefined) =>
  mount(DatasetLink, mergeMountOptions(options, {
    props: { projectId: 1, name: 'trees' },
    container: { router: mockRouter('/') }
  }));

describe('DatasetLink', () => {
  it('shows the name of the entity list', () => {
    mountComponent().text().should.equal('trees');
  });

  it('links to the entity list', () => {
    const component = mountComponent({
      props: { name: 'a b' }
    });
    const { to } = component.getComponent(RouterLinkStub).props();
    to.should.equal('/projects/1/entity-lists/a%20b');
  });
});
