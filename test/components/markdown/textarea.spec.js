import MarkdownTextarea from '../../../src/components/markdown/textarea.vue';
import MarkdownView from '../../../src/components/markdown/view.vue';

import { mergeMountOptions, mount } from '../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(MarkdownTextarea, mergeMountOptions(options, {
    props: { value: '', defaultText: 'default text' }
  }));

describe('MarkdownTextarea', () => {
  it('emits an input event', () => {
    const component = mountComponent();
    component.get('textarea').setValue('foo');
    component.emitted().input.should.eql([['foo']]);
  });

  it('shows placeholder text and no actions as default behavior', () => {
    const component = mountComponent({
      props: { defaultText: 'placeholder text' }
    });
    component.get('.markdown-textarea-actions').should.be.hidden();
    component.get('textarea').attributes().placeholder.should.equal('placeholder text');
  });

  it('shows the actions if there is input', async () => {
    const component = mountComponent();
    const actions = component.get('.markdown-textarea-actions');
    actions.should.be.hidden();
    await component.setProps({ value: 'foo' });
    actions.should.be.visible();
    await component.setProps({ value: '' });
    actions.should.be.hidden();
  });

  it('shows the actions if showFooter is true', () => {
    const component = mountComponent({
      props: { showFooter: true }
    });
    component.get('.markdown-textarea-actions').should.be.visible();
  });

  it('shows the actions if showFooter is true even if input is added and removed', async () => {
    const component = mountComponent({
      props: { showFooter: true }
    });
    const actions = component.get('.markdown-textarea-actions');
    actions.should.be.visible();
    await component.setProps({ value: 'foo' });
    actions.should.be.visible();
    await component.setProps({ value: '' });
    actions.should.be.visible();
  });

  it('does not show markdown preview initially', () => {
    const component = mountComponent();
    component.find('.preview-container').exists().should.be.false();
  });

  it('shows markdown preview after input and button click', async () => {
    const component = mountComponent();
    component.find('.preview-container').exists().should.be.false();
    await component.setProps({ value: 'foo' });
    component.find('.preview-container').exists().should.be.false();
    const previewButton = component.get('.md-preview-btn');
    await previewButton.trigger('click');
    component.find('.preview-container').should.be.visible();
    await previewButton.trigger('click');
    component.find('.preview-container').exists().should.be.false();
  });

  it('shows rendered markdown', async () => {
    const component = mountComponent({
      props: { value: 'this is **bold**' }
    });
    await component.get('.md-preview-btn').trigger('click');
    const preview = component.getComponent(MarkdownView);
    preview.props().rawMarkdown.should.equal('this is **bold**');
    preview.get('div > p').html().should.equal('<p>this is <strong>bold</strong></p>');
  });

  it('uses the default slot', () => {
    const component = mountComponent({
      props: { showFooter: true },
      slots: { default: '<button id="some-button">Button text</button>' }
    });
    component.find('#some-button').exists().should.be.true();
  });

  it('adds "required" to textarea if required prop is true', () => {
    const component = mountComponent({
      props: { required: true }
    });
    const required = component.get('textarea').attributes('required');
    should.exist(required);
  });

  it('does not make textarea required by default', () => {
    const component = mountComponent();
    const required = component.get('textarea').attributes('required');
    should.not.exist(required);
  });

  it('allows custom height via textarea rows prop', () => {
    const component = mountComponent({
      props: { rows: '5' }
    });
    const rows = component.get('textarea').attributes('rows');
    rows.should.equal('5');
  });

  it('allows a null value to be passed to it', () => {
    // the textarea may be displaying null content returned from the API
    // e.g. project.description before it is set.
    const component = mountComponent({
      props: { value: null }
    });
    should.not.exist(component.props().value);
  });
});
