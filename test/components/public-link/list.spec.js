import ProjectSubmissionOptions from '../../../src/components/project/submission-options.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('PublicLinkList', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedForms.createPast(1);
  });

  it('toggles the "Submission Options" modal', () =>
    load('/projects/1/forms/f/public-links').testModalToggles(
      ProjectSubmissionOptions,
      '.heading-with-button a[href="#"]',
      '.btn-primary'
    ));

  it('shows a message if there are no public links', async () => {
    const app = await load('/projects/1/forms/f/public-links');
    app.first('#public-link-list .empty-table-message').should.be.visible();
  });
});
