import FileDropZone from '../../src/components/file-drop-zone.vue';

import { dragAndDrop, fileDataTransfer } from '../util/trigger';
import { mergeMountOptions, mount } from '../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(FileDropZone, mergeMountOptions(options, {
    slots: {
      default: { template: '<p>Some text</p>' }
    }
  }));
const createFile = () => new File([''], 'some_file');

describe('FileDropZone', () => {
  it('uses the default slot', () => {
    mountComponent().get('p').text().should.equal('Some text');
  });

  it('emits an event after dragenter', async () => {
    const component = mountComponent();
    await component.trigger('dragenter', {
      dataTransfer: fileDataTransfer([createFile()])
    });
    const event = component.emitted().dragenter[0][0];
    event.should.be.an.instanceof(DragEvent);
    event.type.should.equal('dragenter');
  });

  describe('dragleave', () => {
    it('emits an event', async () => {
      const component = mountComponent();
      const files = [createFile()];
      await component.trigger('dragenter', {
        dataTransfer: fileDataTransfer(files)
      });
      await component.trigger('dragleave', {
        dataTransfer: fileDataTransfer(files)
      });
      const event = component.emitted().dragleave[0][0];
      event.should.be.an.instanceof(DragEvent);
      event.type.should.equal('dragleave');
    });

    it('emits true after leaving the drop zone', async () => {
      const component = mountComponent();
      const files = [createFile()];
      await component.trigger('dragenter', {
        dataTransfer: fileDataTransfer(files)
      });
      await component.trigger('dragleave', {
        dataTransfer: fileDataTransfer(files)
      });
      component.emitted().dragleave[0][1].should.be.true;
    });

    it('emits true even if user only drags over a child element', async () => {
      const component = mountComponent();
      const p = component.get('p');
      const files = [createFile()];
      // Trigger events as if the user drags over, then out of the <p> child
      // element, without dragging over any other part of the drop zone.
      await p.trigger('dragenter', { dataTransfer: fileDataTransfer(files) });
      await p.trigger('dragleave', { dataTransfer: fileDataTransfer(files) });
      component.emitted().dragleave[0][1].should.be.true;
    });

    it('emits false after moving within the drop zone', async () => {
      const component = mountComponent();
      const files = [createFile()];
      await component.trigger('dragenter', {
        dataTransfer: fileDataTransfer(files)
      });
      const p = component.get('p');
      await p.trigger('dragenter', { dataTransfer: fileDataTransfer(files) });
      await p.trigger('dragleave', { dataTransfer: fileDataTransfer(files) });
      component.emitted().dragleave[0][1].should.be.false;
    });

    it('emits true after leaving drop zone after previously dropping', async () => {
      const component = mountComponent();
      const files = [createFile()];
      await dragAndDrop(component, files);
      await component.trigger('dragenter', {
        dataTransfer: fileDataTransfer(files)
      });
      await component.trigger('dragleave', {
        dataTransfer: fileDataTransfer(files)
      });
      const emitted = component.emitted().dragleave;
      emitted.length.should.equal(1);
      emitted[0][1].should.be.true;
    });
  });

  it('emits an event after drop', async () => {
    const component = mountComponent();
    await dragAndDrop(component, [createFile()]);
    const event = component.emitted().drop[0][0];
    event.should.be.an.instanceof(DragEvent);
    event.type.should.equal('drop');
  });

  describe('dragover class', () => {
    it('adds the class after entering the drop zone', async () => {
      const component = mountComponent();
      component.classes('dragover').should.be.false;
      await component.trigger('dragenter', {
        dataTransfer: fileDataTransfer([createFile()])
      });
      component.classes('dragover').should.be.true;
    });

    it('removes the class after leaving the drop zone', async () => {
      const component = mountComponent();
      const files = [createFile()];
      await component.trigger('dragenter', {
        dataTransfer: fileDataTransfer(files)
      });
      await component.trigger('dragleave', {
        dataTransfer: fileDataTransfer(files)
      });
      component.classes('dragover').should.be.false;
    });

    it('does not remove class after moving within drop zone', async () => {
      const component = mountComponent();
      const files = [createFile()];
      await component.trigger('dragenter', {
        dataTransfer: fileDataTransfer(files)
      });
      const p = component.get('p');
      await p.trigger('dragenter', { dataTransfer: fileDataTransfer(files) });
      await p.trigger('dragleave', { dataTransfer: fileDataTransfer(files) });
      component.classes('dragover').should.be.true;
    });

    it('removes the class after drop', async () => {
      const component = mountComponent();
      const files = [createFile()];
      await component.trigger('dragenter', {
        dataTransfer: fileDataTransfer(files)
      });
      await component.trigger('dragover', {
        dataTransfer: fileDataTransfer(files)
      });
      component.classes('dragover').should.be.true;
      await component.trigger('drop', {
        dataTransfer: fileDataTransfer(files)
      });
      component.classes('dragover').should.be.false;
    });
  });

  describe('no file is dragged', () => {
    it('does not emit after dragenter', async () => {
      const component = mountComponent();
      await component.trigger('dragenter', {
        dataTransfer: new DataTransfer()
      });
      should.not.exist(component.emitted().dragenter);
    });

    it('does not emit after dragleave', async () => {
      const component = mountComponent();
      await component.trigger('dragenter', {
        dataTransfer: new DataTransfer()
      });
      await component.trigger('dragleave', {
        dataTransfer: new DataTransfer()
      });
      should.not.exist(component.emitted().dragleave);
    });

    it('does not emit after drop', async () => {
      const component = mountComponent();
      await dragAndDrop(component, []);
      should.not.exist(component.emitted().drop);
    });

    it('does not add the dragover class', async () => {
      const component = mountComponent();
      await component.trigger('dragenter', {
        dataTransfer: new DataTransfer()
      });
      component.classes('dragover').should.be.false;
    });
  });

  describe('disabled prop is true', () => {
    it('does not emit after dragenter', async () => {
      const component = mountComponent({
        props: { disabled: true }
      });
      await component.trigger('dragenter', {
        dataTransfer: fileDataTransfer([createFile()])
      });
      should.not.exist(component.emitted().dragenter);
    });

    it('does not emit after dragleave', async () => {
      const component = mountComponent({
        props: { disabled: true }
      });
      const files = [createFile()];
      await component.trigger('dragenter', {
        dataTransfer: fileDataTransfer(files)
      });
      await component.trigger('dragleave', {
        dataTransfer: fileDataTransfer(files)
      });
      should.not.exist(component.emitted().dragleave);
    });

    it('does not emit after drop', async () => {
      const component = mountComponent({
        props: { disabled: true }
      });
      await dragAndDrop(component, [createFile()]);
      should.not.exist(component.emitted().drop);
    });

    it('does not add the dragover class', async () => {
      const component = mountComponent({
        props: { disabled: true }
      });
      await component.trigger('dragenter', {
        dataTransfer: fileDataTransfer([createFile()])
      });
      component.classes('dragover').should.be.false;
    });

    it('adds a class named disabled', () => {
      const component = mountComponent({
        props: { disabled: true }
      });
      component.classes('disabled').should.be.true;
    });
  });

  it('adds a class if the styled prop is true', () => {
    const component = mountComponent({
      props: { styled: true }
    });
    component.classes('styled').should.be.true;
  });
});
