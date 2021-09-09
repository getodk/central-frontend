import MarkdownTextarea from '../../../src/components/markdown/textarea.vue';
import MarkdownView from '../../../src/components/markdown/view.vue';

import { mount } from '../../util/lifecycle';

const mountComponent = (propsData) => {
  const props = {
    defaultText: 'default text',
    showFooter: false,
    ...propsData
  };

  const parent = mount({
    data() {
      return {
        body: ''
      };
    },
    template: `<div><markdown-textarea v-model="body"
      default-text="${props.defaultText}"
      :show-footer="${props.showFooter}">
    </markdown-textarea></div>`,
    components: { 'markdown-textarea': MarkdownTextarea }
  });

  return parent.getComponent(MarkdownTextarea);
};

describe('MarkdownTextarea', () => {
  it('shows placeholder text and no actions as default behavior', () => {
    const component = mountComponent({
      defaultText: 'placeholder text'
    });
    component.get('.markdown-textarea-actions').should.be.hidden();
    component.get('textarea').attributes().placeholder.should.equal('placeholder text');
  });

  it('shows the actions if there is input', async () => {
    const component = mountComponent();
    const actions = component.get('.markdown-textarea-actions');
    actions.should.be.hidden();
    const textarea = component.find('textarea');
    await textarea.setValue('foo');
    actions.should.be.visible();
    await textarea.setValue('');
    actions.should.be.hidden();
  });

  it('shows the actions if showFooter is true', () => {
    const component = mountComponent({
      showFooter: true
    });
    component.get('.markdown-textarea-actions').should.be.visible();
  });

  it('shows the actions if showFooter is true even if input is added and removed', async () => {
    const component = mountComponent({
      showFooter: true
    });
    const actions = component.get('.markdown-textarea-actions');
    actions.should.be.visible();
    const textarea = component.get('textarea');
    await textarea.setValue('foo');
    actions.should.be.visible();
    await textarea.setValue('');
    actions.should.be.visible();
  });

  it('does not show markdown preview initially', () => {
    const component = mountComponent();
    component.find('.preview-container').exists().should.be.false();
  });

  it('shows markdown preview after input and button click', async () => {
    const component = mountComponent();
    component.find('.preview-container').exists().should.be.false();
    await component.get('textarea').setValue('foo');
    component.find('.preview-container').exists().should.be.false();
    const previewButton = component.get('.md-preview-btn');
    await previewButton.trigger('click');
    component.find('.preview-container').should.be.visible();
    await previewButton.trigger('click');
    component.find('.preview-container').exists().should.be.false();
  });


  it('shows rendered markdown', async () => {
    const component = mountComponent();
    await component.get('textarea').setValue('this is **bold**');
    await component.get('.md-preview-btn').trigger('click');
    const preview = component.getComponent(MarkdownView);
    preview.props().rawMarkdown.should.equal('this is **bold**');
    preview.get('div > p').html().should.equal('<p>this is <strong>bold</strong></p>');
  });

  it('uses the default slot', () => {
    const component = mount(MarkdownTextarea, {
      propsData: { value: '', defaultText: 'default text', showFooter: true },
      slots: { default: '<button id="some-button">Button text</button>' }
    });
    component.find('#some-button').exists().should.be.true();
  });
});
