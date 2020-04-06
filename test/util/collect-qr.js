import jsQR from 'jsqr';
import pako from 'pako';

// eslint-disable-next-line import/prefer-default-export
export const collectQrData = (img) => {
  const width = img.getAttribute('width');
  const height = img.getAttribute('height');
  const canvas = document.createElement('canvas');
  canvas.setAttribute('width', width);
  canvas.setAttribute('height', height);
  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0);
  const imageData = context.getImageData(0, 0, width, height);
  const encoded = jsQR(imageData.data, width, height).data;
  const inflated = pako.inflate(atob(encoded), { to: 'string' });
  return JSON.parse(inflated);
};
