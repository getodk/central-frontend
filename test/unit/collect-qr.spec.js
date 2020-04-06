import collectQr from '../../src/util/collect-qr';
import { collectQrData } from '../util/collect-qr';
import { wait } from '../util/util';

const htmlToImg = (qrCodeHtml) => {
  const div = document.createElement('div');
  div.innerHTML = qrCodeHtml;
  div.children.length.should.equal(1);
  const img = div.children[0];
  img.tagName.should.equal('IMG');
  return img;
};

describe('collectQr', () => {
  it('encodes the settings', () => {
    const html = collectQr('/path', { errorCorrectionLevel: 'L', cellSize: 1 });
    const img = htmlToImg(html);
    // I am not sure why we need to call wait(). Maybe because `img` uses a data
    // URI?
    return wait().then(() => {
      collectQrData(img).should.eql({
        general: { server_url: `${window.location.origin}/path` },
        admin: {}
      });
    });
  });

  it('uses the error correction level', () => {
    const imgL = htmlToImg(collectQr(
      '/path',
      { errorCorrectionLevel: 'L', cellSize: 1 }
    ));
    const imgM = htmlToImg(collectQr(
      '/path',
      { errorCorrectionLevel: 'M', cellSize: 1 }
    ));

    const widthL = parseInt(imgL.getAttribute('width'), 10);
    const widthM = parseInt(imgM.getAttribute('width'), 10);

    widthM.should.be.above(widthL);
  });

  it('uses the cell size', () => {
    const img1 = htmlToImg(collectQr(
      '/path',
      { errorCorrectionLevel: 'L', cellSize: 1 }
    ));
    const img2 = htmlToImg(collectQr(
      '/path',
      { errorCorrectionLevel: 'L', cellSize: 2 }
    ));

    const width1 = parseInt(img1.getAttribute('width'), 10);
    const width2 = parseInt(img2.getAttribute('width'), 10);

    width2.should.equal(2 * width1);
  });
});
