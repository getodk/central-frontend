import { RouterLinkStub } from '@vue/test-utils';

import LinkIfCan from '../../../src/components/link-if-can.vue';
import ProjectSubmissionOptions from '../../../src/components/project/submission-options.vue';

import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';

const mountComponent = (options) =>
  mount(ProjectSubmissionOptions, mergeMountOptions(options, {
    props: { state: true }
  }));

describe('ProjectSubmissionOptions', () => {
  beforeEach(mockLogin);

  describe('link to .../app-users', () => {
    it('links to .../app-users', () => {
      const modal = mountComponent({
        container: { router: mockRouter('/projects/1/forms/f') }
      });
      const link = modal.getComponent(RouterLinkStub);
      modal.get('li').element.contains(link.element).should.be.true();
      link.props().to.should.equal('/projects/1/app-users');
      link.text().should.equal('App Users');
    });

    it('hides modal if user has already navigated to .../app-users', async () => {
      const modal = mountComponent({
        container: { router: mockRouter('/projects/1/app-users') }
      });
      const a = modal.get('li').get('a');
      a.attributes().href.should.equal('#');
      a.text().should.equal('App Users');
      await a.trigger('click');
      modal.emitted().hide.should.eql([[]]);
    });
  });

  describe('link to .../public-links', () => {
    it('links to .../public-links', () => {
      const modal = mountComponent({
        container: { router: mockRouter('/projects/1/forms/f') }
      });
      const link = modal.findAllComponents(RouterLinkStub)[1];
      modal.findAll('li')[1].element.contains(link.element).should.be.true();
      link.props().to.should.equal('/projects/1/forms/f/public-links');
      link.text().should.equal('Public Access Links');
    });

    it('hides modal if user has already navigated to .../public-links', async () => {
      const modal = mountComponent({
        container: { router: mockRouter('/projects/1/forms/f/public-links') }
      });
      const a = modal.findAll('li')[1].get('a');
      a.attributes().href.should.equal('#');
      a.text().should.equal('Public Access Links');
      await a.trigger('click');
      modal.emitted().hide.should.eql([[]]);
    });

    it('does not render a link if user has navigated to a project route', () => {
      const modal = mountComponent({
        container: { router: mockRouter('/projects/1/app-users') }
      });
      const li = modal.findAll('li')[1];
      li.find('a').exists().should.be.false();
      li.get('strong').text().should.equal('Public Access Links');
    });
  });

  it('renders a LinkIfCan component to /users', () => {
    const modal = mountComponent({
      container: { router: mockRouter('/projects/1/app-users') }
    });
    modal.getComponent(LinkIfCan).props().to.should.equal('/users');
  });
});
