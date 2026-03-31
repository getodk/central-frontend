import AccountPageContainer from '../../../../src/components/account/page/container.vue';

import testData from '../../../data';
import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(AccountPageContainer, mergeMountOptions(options, {
    container: {
      requestData: { serverConfig: testData.standardConfigs.byKey() }
    }
  }));

describe('AccountPageContainer', () => {
  describe('logo', () => {
    it('shows the default logo if a custom one has not been configured', () => {
      const component = mountComponent();
      const img = component.findAll('#account-page-container-logo img');
      img.length.should.equal(1);
      // Asserting on `alt` rather than `src` because `src` ends up being a data
      // URL. Probably from Vite, maybe because the logo is small.
      img[0].attributes().alt.should.equal('ODK logo');
    });

    it('shows a custom logo', () => {
      testData.standardConfigs.createPast(1, { key: 'logo', blobExists: true });
      const component = mountComponent();
      const img = component.findAll('#account-page-container-logo img');
      img.length.should.equal(1);
      img[0].attributes().alt.should.equal('Organization logo');
    });
  });

  describe('hero image', () => {
    it('shows default hero image if a custom one has not been configured', () => {
      const component = mountComponent();
      const img = component.findAll('#account-page-container-hero img');
      img.length.should.equal(1);
      const { alt, src } = img[0].attributes();
      alt.should.equal('Features of ODK Central');
      src.should.include('default-hero');
    });

    it('shows a custom hero image', () => {
      testData.standardConfigs.createPast(1, { key: 'hero-image', blobExists: true });
      const component = mountComponent();
      const img = component.findAll('#account-page-container-hero img');
      img.length.should.equal(1);
      const { alt, src } = img[0].attributes();
      alt.should.equal('Welcome image');
      src.should.startWith('/v1/config/public/hero-image?');
    });
  });

  it('uses a cache-busting query parameter', () => {
    testData.standardConfigs.createPast(1, {
      key: 'hero-image',
      blobExists: true,
      setAt: '1970-01-01T00:00:00.123Z'
    });
    const component = mountComponent();
    const img = component.get('#account-page-container-hero img');
    img.attributes().src.should.equal('/v1/config/public/hero-image?ts=123');
  });

  it('is inert during preview', () => {
    const component = mountComponent({
      props: { preview: true }
    });
    should.exist(component.attributes().inert);
  });
});
