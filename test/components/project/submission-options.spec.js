import LinkIfCan from '../../../src/components/link-if-can.vue';
import ProjectSubmissionOptions from '../../../src/components/project/submission-options.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

const showModal = async (path) => {
  const app = await load(path);
  if (path === '/projects/1/app-users' ||
    path === '/projects/1/forms/f/public-links')
    await trigger.click(app, '.heading-with-button a[href="#"]');
  else if (path === '/projects/1/forms/f')
    await trigger.click(app, '#form-checklist a[href="#"]');
  else
    throw new Error('invalid path');
  return app.first(ProjectSubmissionOptions);
};

describe('ProjectSubmissionOptions', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedForms.createPast(1);
  });

  describe('link to .../app-users', () => {
    it('links to .../app-users', async () => {
      const modal = await showModal('/projects/1/forms/f/public-links');
      const a = modal.first('li').first('a');
      a.getAttribute('href').should.equal('#/projects/1/app-users');
      a.text().should.equal('App Users');
    });

    it('hides modal if user has already navigated to .../app-users', async () => {
      const modal = await showModal('/projects/1/app-users');
      const a = modal.first('li').first('a');
      a.getAttribute('href').should.equal('#');
      a.text().should.equal('App Users');
      await trigger.click(a);
      modal.getProp('state').should.be.false();
    });
  });

  describe('link to .../public-links', () => {
    it('links to .../public-links', async () => {
      const modal = await showModal('/projects/1/forms/f');
      const a = modal.find('li')[1].first('a');
      a.getAttribute('href').should.equal('#/projects/1/forms/f/public-links');
      a.text().should.equal('Public Access Links');
    });

    it('hides modal if user has already navigated to .../public-links', async () => {
      const modal = await showModal('/projects/1/forms/f/public-links');
      const a = modal.find('li')[1].first('a');
      a.getAttribute('href').should.equal('#');
      a.text().should.equal('Public Access Links');
      await trigger.click(a);
      modal.getProp('state').should.be.false();
    });

    it('does not render a link if user has navigated to a project route', async () => {
      const modal = await showModal('/projects/1/app-users');
      const li = modal.find('li')[1];
      li.find('a').length.should.equal(0);
      li.first('strong').text().should.equal('Public Access Links');
    });
  });

  it('renders a LinkIfCan component to /users', async () => {
    const modal = await showModal('/projects/1/app-users');
    modal.first(LinkIfCan).getProp('to').should.equal('/users');
  });
});
