import AnalyticsPreview from '../../../src/components/analytics/preview.vue';

import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('AnalyticsPreview', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () =>
    load('/system/analytics', { root: false }).testModalToggles({
      modal: AnalyticsPreview,
      show: '#analytics-form-enabled-true-help a',
      hide: '.btn-primary',
      respond: (series) => series.respondWithData(() => ({ num_admins: 1 }))
    }));

  it('sends the correct request', () =>
    mockHttp()
      .mount(AnalyticsPreview)
      .request(modal => modal.setProps({ state: true }))
      .respondWithData(() => ({ num_admins: 1 }))
      .testRequests([{ url: '/v1/analytics/preview' }]));

  it('shows the preview', () =>
    mockHttp()
      .mount(AnalyticsPreview)
      .request(modal => modal.setProps({ state: true }))
      .respondWithData(() => ({ num_admins: 1 }))
      .afterResponse(modal => {
        modal.get('code').text().should.equal('{\n  "num_admins": 1\n}');
      }));
});
