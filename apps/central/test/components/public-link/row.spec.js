import DateTime from '../../../src/components/date-time.vue';
import PublicLinkRow from '../../../src/components/public-link/row.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(PublicLinkRow, {
  props: { publicLink: testData.extendedPublicLinks.last() },
  container: {
    requestData: { form: testData.extendedForms.last() }
  }
});

describe('PublicLinkRow', () => {
  beforeEach(mockLogin);

  it('shows the display name', async () => {
    testData.extendedPublicLinks.createPast(1, {
      displayName: 'My Public Link'
    });
    const row = mountComponent();
    const span = row.get('.display-name span');
    span.text().should.equal('My Public Link');
    await span.should.have.textTooltip();
  });

  describe('"Single Submission" column', () => {
    it('shows "Yes" if the once property is true', () => {
      testData.extendedPublicLinks.createPast(1, { once: true });
      mountComponent().get('.once').text().should.equal('Yes');
    });

    it('shows "No" if the once property is false', () => {
      testData.extendedPublicLinks.createPast(1, { once: false });
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
        testData.extendedPublicLinks.createPast(1, {
          once: false,
          token: 'abc'
        });
        const url = mountComponent().get('.access-link .selectable').text();
        url.should.equal('http://localhost:9876/f/xyz?st=abc');
      });

      it('indicates if the form does not have an enketoId', async () => {
        testData.extendedForms.createPast(1, {
          enketoId: null,
          enketoOnceId: 'zyx'
        });
        testData.extendedPublicLinks.createPast(1, {
          once: false,
          token: 'abc'
        });
        const span = mountComponent().get('.access-link span');
        span.text().should.equal('Not available yet');
        await span.should.have.tooltip('Public Access Link is not available yet. It has not finished being processed. Please refresh later and try again.');
      });
    });

    describe('once property is true', () => {
      it('uses the enketoOnceId', () => {
        testData.extendedForms.createPast(1, {
          enketoId: 'xyz',
          enketoOnceId: 'zyx'
        });
        testData.extendedPublicLinks.createPast(1, {
          once: true,
          token: 'abc'
        });
        const url = mountComponent().get('.access-link .selectable').text();
        url.should.equal('http://localhost:9876/f/zyx?st=abc');
      });

      it('indicates if the form does not have an enketoOnceId', async () => {
        testData.extendedForms.createPast(1, {
          enketoId: 'xyz',
          enketoOnceId: null
        });
        testData.extendedPublicLinks.createPast(1, {
          once: true,
          token: 'abc'
        });
        const span = mountComponent().get('.access-link span');
        span.text().should.equal('Not available yet');
        await span.should.have.tooltip('Public Access Link is not available yet. It has not finished being processed. Please refresh later and try again.');
      });
    });

    it('indicates if the public link is revoked', () => {
      testData.extendedForms.createPast(1, {
        enketoId: 'xyz',
        enketoOnceId: 'zyx'
      });
      testData.extendedPublicLinks.createPast(1, { token: null });
      mountComponent().get('.access-link').text().should.equal('Revoked');
    });
  });

  it('shows createdAt', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    const { createdAt } = testData.extendedPublicLinks.createPast(1).last();
    const row = mountComponent();
    row.getComponent(DateTime).props().iso.should.equal(createdAt);
  });

  describe('revoke button', () => {
    it('shows the button if the public link has a token', () => {
      testData.extendedPublicLinks.createPast(1, { token: 'abc' });
      mountComponent().get('.revoke-button').should.be.visible();
    });

    it('does not render button if public link does not have a token', () => {
      testData.extendedPublicLinks.createPast(1, { token: null });
      mountComponent().find('.revoke-button').exists().should.be.false;
    });
  });

  it('shows a column header for each actor property', () => {
    testData.extendedForms.createPast(1);
    testData.extendedPublicLinks.createPast(1);
    testData.actorProperties.createPast(1, { name: 'region' });
    testData.actorProperties.createPast(1, { name: 'department' });
    return load('/projects/1/forms/f/public-links').then(app => {
      const headers = app.findAll('#public-link-table .table-freeze-scrolling th');
      const headerTexts = headers.map(h => h.text());
      headerTexts.should.include('region');
      headerTexts.should.include('department');
    });
  });
});
