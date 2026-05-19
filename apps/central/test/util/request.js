// eslint-disable-next-line import/prefer-default-export
export const relativeUrl = (url) => {
  url.should.startWith('/');
  return new URL(url, window.location.origin);
};
