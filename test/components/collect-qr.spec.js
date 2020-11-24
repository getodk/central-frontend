import jsQR from 'jsqr';
import pako from 'pako';

import CollectQr from '../../src/components/collect-qr.vue';

import { mount } from '../util/lifecycle';
import { wait } from '../util/util';

const mountComponent = (propsData) => mount(CollectQr, {
  propsData: {
    settings: { server_url: '/path' },
    errorCorrectionLevel: 'L',
    cellSize: 1,
    ...propsData
  }
});

const qrData = (component) => {
  const img = component.vm.$el.querySelector('img');
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

describe('CollectQr', () => {
  it('renders an image', () => {
    const component = mountComponent();
    const { childNodes } = component.vm.$el;
    childNodes.length.should.equal(1);
    childNodes[0].tagName.should.equal('IMG');
  });

  describe('settings', () => {
    it('prepends the origin to server_url', async () => {
      const component = mountComponent({
        settings: { server_url: '/path' }
      });
      // I think we need to wait for the image to render?
      await wait();
      qrData(component).should.eql({
        general: { server_url: 'http://localhost:9876/path' },
        admin: {}
      });
    });

    it('encodes other settings', async () => {
      const component = mountComponent({
        settings: { server_url: '/path', x: 'y' }
      });
      await wait();
      qrData(component).should.eql({
        general: { server_url: 'http://localhost:9876/path', x: 'y' },
        admin: {}
      });
    });
  });

  it('uses the errorCorrectionLevel prop', () => {
    const componentL = mountComponent({ errorCorrectionLevel: 'L' });
    const componentM = mountComponent({ errorCorrectionLevel: 'M' });

    const widthL = parseInt(
      // Using querySelector() rather than avoriaz first(), because avoriaz
      // can't seem to find the <img> element (maybe because we use v-html?).
      componentL.vm.$el.querySelector('img').getAttribute('width'),
      10
    );
    const widthM = parseInt(
      componentM.vm.$el.querySelector('img').getAttribute('width'),
      10
    );

    widthM.should.be.above(widthL);
  });

  it('uses the cellSize prop', () => {
    const component1 = mountComponent({ cellSize: 1 });
    const component2 = mountComponent({ cellSize: 2 });

    const width1 = parseInt(
      component1.vm.$el.querySelector('img').getAttribute('width'),
      10
    );
    const width2 = parseInt(
      component2.vm.$el.querySelector('img').getAttribute('width'),
      10
    );

    width2.should.equal(2 * width1);
  });
});
