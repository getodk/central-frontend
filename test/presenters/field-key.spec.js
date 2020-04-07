import FieldKey from '../../src/presenters/field-key';
import testData from '../data';
import { collectQrData } from '../util/collect-qr';
import { wait } from '../util/util';

describe('FieldKey', () => {
  it('returns a QR code that encodes the correct settings', () => {
    const div = document.createElement('div');
    const fieldKey = new FieldKey(testData.extendedFieldKeys.createNew());
    div.innerHTML = fieldKey.qrCodeHtml();
    div.children.length.should.equal(1);
    const img = div.children[0];
    img.tagName.should.equal('IMG');
    // I am not sure why we need to call wait(). Maybe because `img` uses a data
    // URI?
    return wait().then(() => {
      const { token } = fieldKey;
      collectQrData(img).should.eql({
        general: {
          server_url: `${window.location.origin}/v1/key/${token}/projects/1`
        },
        admin: {}
      });
    });
  });
});
