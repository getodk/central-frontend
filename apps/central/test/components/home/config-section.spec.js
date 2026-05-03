import HomeConfigSection from '../../../src/components/home/config-section.vue';
import MarkdownView from '../../../src/components/markdown/view.vue';

import { mount } from '../../util/lifecycle';

describe('HomeConfigSection', () => {
  it('shows the title', () => {
    const component = mount(HomeConfigSection, {
      props: { title: 'Some Title', body: 'Some **body** text' }
    });
    component.get('.page-section-heading').text().should.equal('Some Title');
  });

  it('renders the body prop as Markdown', () => {
    const component = mount(HomeConfigSection, {
      props: { title: 'Some Title', body: 'Some **body** text' }
    });
    const { rawMarkdown } = component.getComponent(MarkdownView).props();
    rawMarkdown.should.equal('Some **body** text');
  });
});
