import PublicLinkRow from '../../../src/components/public-link/row.vue';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(PublicLinkRow, {
  propsData: { publicLink: testData.standardPublicLinks.last() },
  requestData: { form: testData.extendedForms.last() }
});

describe('PublicLinkRow', () => {
  beforeEach(mockLogin);

  it('shows the display name', () => {
    testData.standardPublicLinks.createPast(1, {
      displayName: 'My Public Link'
    });
    const row = mountComponent();
    const span = row.first('.display-name span');
    span.text().trim().should.equal('My Public Link');
    span.getAttribute('title').should.equal('My Public Link');
  });

  describe('"Multiple responses" column', () => {
    it('shows "Yes" if the once property is false', () => {
      testData.standardPublicLinks.createPast(1, { once: false });
      mountComponent().first('.multiple').text().trim().should.equal('Yes');
    });

    it('shows "No" if the once property is true', () => {
      testData.standardPublicLinks.createPast(1, { once: true });
      mountComponent().first('.multiple').text().trim().should.equal('No');
    });
  });

  describe('"Access Link" column', () => {
    describe('once property is false', () => {
      it('uses the enketoId', () => {
        testData.extendedForms.createPast(1, {
          enketoId: 'xyz',
          enketoOnceId: 'zyx'
        });
        testData.standardPublicLinks.createPast(1, {
          once: false,
          token: 'abc'
        });
        const url = mountComponent().first('.access-link .selectable').text();
        url.should.equal('http://localhost:9876/_/single/xyz?st=abc');
      });

      it('indicates if the form does not have an enketoId', () => {
        testData.extendedForms.createPast(1, {
          enketoId: null,
          enketoOnceId: 'zyx'
        });
        testData.standardPublicLinks.createPast(1, {
          once: false,
          token: 'abc'
        });
        const span = mountComponent().first('.access-link span');
        span.text().should.equal('Not available yet');
        span.hasAttribute('title').should.be.true();
      });
    });

    describe('once property is true', () => {
      it('uses the enketoOnceId', () => {
        testData.extendedForms.createPast(1, {
          enketoId: 'xyz',
          enketoOnceId: 'zyx'
        });
        testData.standardPublicLinks.createPast(1, {
          once: true,
          token: 'abc'
        });
        const url = mountComponent().first('.access-link .selectable').text();
        url.should.equal('http://localhost:9876/_/single/zyx?st=abc');
      });

      it('indicates if the form does not have an enketoOnceId', () => {
        testData.extendedForms.createPast(1, {
          enketoId: 'xyz',
          enketoOnceId: null
        });
        testData.standardPublicLinks.createPast(1, {
          once: true,
          token: 'abc'
        });
        const span = mountComponent().first('.access-link span');
        span.text().should.equal('Not available yet');
        span.hasAttribute('title').should.be.true();
      });
    });

    it('indicates if the public link is revoked', () => {
      testData.extendedForms.createPast(1, {
        enketoId: 'xyz',
        enketoOnceId: 'zyx'
      });
      testData.standardPublicLinks.createPast(1, { token: null });
      const text = mountComponent().first('.access-link').text().trim();
      text.should.equal('Revoked');
    });
  });

  describe('revoke button', () => {
    it('shows the button if the public link has a token', () => {
      testData.standardPublicLinks.createPast(1, { token: 'abc' });
      mountComponent().first('.btn-danger').should.be.visible();
    });

    it('does not render button if public link does not have a token', () => {
      testData.standardPublicLinks.createPast(1, { token: null });
      mountComponent().find('.btn-danger').length.should.equal(0);
    });
  });
});
