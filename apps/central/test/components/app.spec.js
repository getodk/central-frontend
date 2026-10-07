import FeedbackButton from '../../src/components/feedback-button.vue';

import { load } from '../util/http';
import { mockLogin } from '../util/session';

describe('App', () => {
  describe('feedback button', () => {
    it('is shown if a user is logged in and config is true', async () => {
      const container = {
        config: { showsFeedbackButton: true }
      };
      mockLogin();

      const app = await load('/', { container });
      app.findComponent(FeedbackButton).exists().should.be.true;
    });

    it('is hidden if a user is logged in and config is false', async () => {
      const container = {
        config: { showsFeedbackButton: false }
      };
      mockLogin();

      const app = await load('/', { container });
      app.findComponent(FeedbackButton).exists().should.be.false;
    });

    it('is hidden if no user is logged in and config is true', async () => {
      const container = {
        config: { showsFeedbackButton: true }
      };

      const app = await load('/login', { container }).restoreSession(false);
      app.findComponent(FeedbackButton).exists().should.be.false;
    });
  });
});
