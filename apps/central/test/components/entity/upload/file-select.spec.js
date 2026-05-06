import EntityUploadFileSelect from '../../../../src/components/entity/upload/file-select.vue';

import { dragAndDrop, setFiles } from '../../../util/trigger';
import { mount } from '../../../util/lifecycle';

const csv = new File([''], 'my_data.csv');

describe('EntityUploadFileSelect', () => {
  describe('after a file is selected using the button', () => {
    it('emits a change event', async () => {
      const component = mount(EntityUploadFileSelect);
      await setFiles(component.get('input'), [csv]);
      const file = component.emitted().change[0][0];
      file.should.be.an.instanceof(File);
      file.name.should.equal('my_data.csv');
    });

    it('resets the input', async () => {
      const component = mount(EntityUploadFileSelect);
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
