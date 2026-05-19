import SubmissionDelete from '../../../src/components/submission/delete.vue';

import { mergeMountOptions, mount } from '../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(SubmissionDelete, mergeMountOptions(options, {
    props: { state: true, checkbox: true }
  }));

describe('SubmissionDelete', () => {
  it('focuses the checkbox', () => {
    const modal = mountComponent({ attachTo: document.body });
    modal.get('input').should.be.focused();
  });

  it('resets the checkbox after the modal is hidden', async () => {
    const modal = mountComponent();
    const input = modal.get('input');
    input.element.checked.should.be.false;
    await input.setChecked();
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    input.element.checked.should.be.false;
  });

  it('does not render the checkbox if the checkbox prop is false', () => {
    const modal = mountComponent({
      props: { checkbox: false }
    });
    modal.find('input').exists().should.be.false;
  });
});
