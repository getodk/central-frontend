import EntityUploadDataTemplate from '../../../../src/components/entity/upload/data-template.vue';
import EntityUploadFileSelect from '../../../../src/components/entity/upload/file-select.vue';
import FileDropZone from '../../../../src/components/file-drop-zone.vue';

import { dragAndDrop, setFiles } from '../../../util/trigger';
import { mount } from '../../../util/lifecycle';

const mountComponent = (options = {}) => mount(EntityUploadFileSelect, options);
const csv = new File([''], 'my_data.csv');

describe('EntityUploadFileSelect', () => {
  describe('dataTemplate prop', () => {
    it('renders correctly if the prop is true', () => {
      const component = mountComponent({
        props: { dataTemplate: true }
      });
      component.findComponent(EntityUploadDataTemplate).exists().should.be.true;
      component.get('p').text().should.equal('Upload a .csv file');
    });

    it('renders correctly if the prop is false', () => {
      const component = mountComponent({
        props: { dataTemplate: false }
      });
      component.findComponent(EntityUploadDataTemplate).exists().should.be.false;
      component.find('p').exists().should.be.false;
    });
  });

  it('shows the number of errors', () => {
    const component = mountComponent({
      props: { errors: 2, dataTemplate: true }
    });
    component.get('p').text().should.startWith('2 errors must be fixed');
  });

  it('disables elements if the disabled prop is true', () => {
    const component = mountComponent({
      props: { disabled: true }
    });
    component.getComponent(FileDropZone).props().disabled.should.be.true;
    component.get('input + button').attributes('aria-disabled').should.equal('true');
  });

  describe('after a file is selected using the button', () => {
    it('emits a change event', async () => {
      const component = mountComponent();
      await setFiles(component.get('input'), [csv]);
      const file = component.emitted().change[0][0];
      file.should.be.an.instanceof(File);
      file.name.should.equal('my_data.csv');
    });

    it('resets the input', async () => {
      const component = mountComponent();
      const input = component.get('input');
      await setFiles(input, [csv]);
      input.element.value.should.equal('');
    });
  });

  it('emits a change event after a file is dropped', async () => {
    const component = mount(EntityUploadFileSelect);
    await dragAndDrop(component, [csv]);
    const file = component.emitted().change[0][0];
    file.should.be.an.instanceof(File);
    file.name.should.equal('my_data.csv');
  });
});
