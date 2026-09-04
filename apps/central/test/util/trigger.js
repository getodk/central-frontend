export const changeMultiselect = (selector, selectedIndexes) => async (component) => {
  if (component.element.getRootNode() !== document)
    throw new Error('component must be attached to the body');
  const multiselect = component.get(selector);
  const toggle = multiselect.get('.dropdown-trigger');
  await toggle.trigger('click');
  await multiselect.get('.select-none').trigger('click');
  const inputs = multiselect.findAll('input[type="checkbox"]');
  for (const i of selectedIndexes)
    await inputs[i].setValue(true);
  return multiselect.find('.action-bar button').trigger('click');
};

export const addActorProperty = async (component, name, value = '') => {
  const newProperty = component.get('.actor-properties-new');
  await newProperty.get('.add-property-link').trigger('click');
  await newProperty.get('input').setValue(name);
  await newProperty.get('form').trigger('submit');

  if (value !== '') {
    const upsert = component.get('.actor-properties-upsert');
    await upsert.get('.entity-update-row:last-child textarea').setValue(value);
  }
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
