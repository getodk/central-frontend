// eslint-disable-next-line import/prefer-default-export
export const wait = (delay = 0) => new Promise(resolve => {
  setTimeout(resolve, delay);
});
