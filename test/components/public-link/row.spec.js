import PublicLinkRow from '../../../src/components/public-link/row.vue';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(PublicLinkRow, {
  props: { publicLink: testData.standardPublicLinks.last() },
  container: {
    requestData: { form: testData.extendedForms.last() }
  }
});

describe('PublicLinkRow', () => {
  beforeEach(mockLogin);

  it('shows the display name', () => {
    testData.standardPublicLinks.createPast(1, {
      displayName: 'My Public Link'
    });
    const row = mountComponent();
    const span = row.get('.display-name span');
    span.text().should.equal('My Public Link');
    span.attributes().title.should.equal('My Public Link');
  });

  describe('"Single Submission" column', () => {
    it('shows "Yes" if the once property is true', () => {
      testData.standardPublicLinks.createPast(1, { once: true });
      mountComponent().get('.once').text().should.equal('Yes');
    });

    it('shows "No" if the once property is false', () => {
      testData.standardPublicLinks.createPast(1, { once: false });
      mountComponent().get('.once').text().should.equal('No');
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
        const url = mountComponent().get('.access-link .selectable').text();
        url.should.equal('http://localhost:9876/-/single/xyz?st=abc');
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
        const span = mountComponent().get('.access-link span');
        span.text().should.equal('Not available yet');
        should.exist(span.attributes().title);
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
        const url = mountComponent().get('.access-link .selectable').text();
        url.should.equal('http://localhost:9876/-/single/zyx?st=abc');
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
        const span = mountComponent().get('.access-link span');
        span.text().should.equal('Not available yet');
        should.exist(span.attributes().title);
      });
    });

    it('indicates if the public link is revoked', () => {
      testData.extendedForms.createPast(1, {
        enketoId: 'xyz',
        enketoOnceId: 'zyx'
      });
      testData.standardPublicLinks.createPast(1, { token: null });
      mountComponent().get('.access-link').text().should.equal('Revoked');
    });
  });

  describe('revoke button', () => {
    it('shows the button if the public link has a token', () => {
      testData.standardPublicLinks.createPast(1, { token: 'abc' });
      mountComponent().get('.btn-danger').should.be.visible();
    });

    it('does not render button if public link does not have a token', () => {
      testData.standardPublicLinks.createPast(1, { token: null });
      mountComponent().find('.btn-danger').exists().should.be.false();
    });
  });
});
