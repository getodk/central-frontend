import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('ConfigLogin', () => {
  beforeEach(mockLogin);

  it('sends the correct initial requests', () =>
    load('/system/config').testRequests([
      { url: '/v1/config/public' }
    ]));
});
