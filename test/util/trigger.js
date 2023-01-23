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
  const dataTransfer = fileDataTransfer(files);
  await wrapper.trigger('dragenter', { dataTransfer });
  await wrapper.trigger('dragover', { dataTransfer });
  return wrapper.trigger('drop', { dataTransfer });
};
