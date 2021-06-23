import SummaryItem from '../../../src/components/summary-item.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { wait } from '../../util/util';

describe('ProjectList', () => {
  describe('Right Now', () => {
    describe('users', () => {
      beforeEach(mockLogin);

      it('shows the count', async () => {
        const component = await load('/', { root: false });
        const counts = component.findAll('.summary-item-heading');
        counts.length.should.equal(2);
        counts.at(0).text().should.equal('1');
      });

      it('links to the users page', async () => {
        const component = await load('/', { root: false });
        const { routeTo } = component.getComponent(SummaryItem).props();
        routeTo.should.equal('/users');
      });
    });

    describe('projects', () => {
      beforeEach(mockLogin);

      it('shows the count', async () => {
        testData.extendedProjects.createPast(2);
        const component = await load('/', { root: false });
        const counts = component.findAll('.summary-item-heading');
        counts.length.should.equal(2);
        counts.at(1).text().should.equal('2');
      });

      it('scrolls down after a click', async () => {
        testData.extendedProjects.createPast(1);
        const component = await load('/', {
          root: false,
          attachTo: document.body
        });
        window.pageYOffset.should.equal(0);
        await component.findAll('.summary-item-icon-container').at(1).trigger('click');
        // Wait for the animation to complete.
        await wait(400);
        window.pageYOffset.should.not.equal(0);
      });
    });

    it('does not render users summary if user cannot user.list', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(2);
      const component = await load('/', { root: false }, { users: false });
      const counts = component.findAll('.summary-item-heading');
      counts.length.should.equal(1);
      counts.at(0).text().should.eql('2');
    });
  });

  describe('Projects section', () => {
    beforeEach(mockLogin);

    it('shows a message if there are no projects', async () => {
      const component = await load('/', { root: false });
      const message = component.get('#project-list-projects .empty-table-message');
      message.should.be.visible();
    });
  });
});
