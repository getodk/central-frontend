import jsQR from 'jsqr';
import pako from 'pako';
import { nextTick } from 'vue';

import CollectQr from '../../src/components/collect-qr.vue';

import { mount } from '../util/lifecycle';
import { wait } from '../util/util';

const mountComponent = (props) => mount(CollectQr, {
  props: {
    settings: {
      general: { server_url: 'http://localhost:9876/path' },
      admin: {}
    },
    errorCorrectionLevel: 'L',
    cellSize: 1,
    ...props
  }
});

const qrData = (component) => {
  const img = component.get('img');
  const { width, height } = img.attributes();
  const canvas = document.createElement('canvas');
  canvas.setAttribute('width', width);
  canvas.setAttribute('height', height);
  const context = canvas.getContext('2d');
  context.drawImage(img.element, 0, 0);
  const imageData = context.getImageData(0, 0, width, height);
  const encoded = jsQR(imageData.data, width, height).data;
  const inflated = pako.inflate(atob(encoded), { to: 'string' });
  return JSON.parse(inflated);
};

describe('CollectQr', () => {
  it('renders an image', async () => {
    const { childNodes } = mountComponent().get('span').element;
    await nextTick(); // wait for QR image to render in canvas
    childNodes.length.should.equal(1);
    childNodes[0].tagName.should.equal('IMG');
  });

  it('encodes the settings', async () => {
    const component = mountComponent({
      settings: {
        general: { server_url: 'http://localhost:9876/path' },
        project: { name: 'My Project' },
        admin: {}
      }
    });
    // I think we need to wait for the image to render?
    await wait();
    qrData(component).should.eql({
      general: { server_url: 'http://localhost:9876/path' },
      project: { name: 'My Project' },
      admin: {}
    });
  });

  it('uses the errorCorrectionLevel prop', async () => {
    const componentL = mountComponent({ errorCorrectionLevel: 'L' });
    const componentM = mountComponent({ errorCorrectionLevel: 'M' });

    await nextTick(); // wait for QR image to render in canvas

    const widthL = Number.parseInt(
      componentL.element.querySelector('img').getAttribute('width'),
      10
    );
    const widthM = Number.parseInt(
      componentM.element.querySelector('img').getAttribute('width'),
      10
    );

    widthM.should.be.above(widthL);
  });

  it('uses the cellSize prop', async () => {
    const component1 = mountComponent({ cellSize: 1 });
    const component2 = mountComponent({ cellSize: 2 });

    await nextTick(); // wait for QR image to render in canvas

    const width1 = Number.parseInt(
      component1.element.querySelector('img').getAttribute('width'),
      10
    );
    const width2 = Number.parseInt(
      component2.element.querySelector('img').getAttribute('width'),
      10
    );

    width2.should.equal(2 * (width1 - 15)); // remove negative padding
  });
});
