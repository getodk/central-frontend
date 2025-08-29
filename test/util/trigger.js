export const changeMultiselect = (selector, selectedIndexes) => async (component) => {
  if (component.element.getRootNode() !== document)
    throw new Error('component must be attached to the body');
  const multiselect = component.get(selector);
  const toggle = multiselect.get('select');
  await toggle.trigger('click');
  await multiselect.get('.select-none').trigger('click');
  const inputs = multiselect.findAll('input[type="checkbox"]');
  for (const i of selectedIndexes)
    await inputs[i].setValue(true);
  return multiselect.find('.action-bar button').trigger('click');
};



////////////////////////////////////////////////////////////////////////////////
// FILES

export const fileDataTransfer = (files) => {
  const dt = new DataTransfer();
  for (const file of files)
    dt.items.add(file);
  return dt;
};

export const setFiles = (wrapper, files) => {
  // eslint-disable-next-line no-param-reassign
  wrapper.element.files = fileDataTransfer(files).files;
  return wrapper.trigger('change');
};

export const dragAndDrop = async (wrapper, files) => {
  await wrapper.trigger('dragenter', { dataTransfer: fileDataTransfer(files) });
  await wrapper.trigger('dragover', { dataTransfer: fileDataTransfer(files) });
  return wrapper.trigger('drop', { dataTransfer: fileDataTransfer(files) });
};
