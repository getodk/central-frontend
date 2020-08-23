import SummaryItem from '../../../../src/components/summary-item.vue';
import testData from '../../../data';
import { mockLogin } from '../../../util/session';
import { mockRoute } from '../../../util/http';
import { trigger } from '../../../util/event';

describe('ProjectOverviewRightNow', () => {
  beforeEach(mockLogin);

  describe('app users', () => {
    it('shows the count', () =>
      mockRoute('/projects/1')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { appUsers: 3 }).last())
        .respondWithData(() => testData.extendedForms.sorted())
        .afterResponses(app => {
          const items = app.find(SummaryItem);
          items.length.should.equal(2);
          const heading = items[0].first('.summary-item-heading').text().trim();
          heading.should.equal('3');
        }));

    it('links to the app users page', () =>
      mockRoute('/projects/1')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { appUsers: 1 }).last())
        .respondWithData(() => testData.extendedForms.sorted())
        .afterResponses(app => {
          const items = app.find(SummaryItem);
          items.length.should.equal(2);
          const iconContainer = items[0].first('.summary-item-icon-container');
          const href = iconContainer.getAttribute('href');
          href.should.equal('#/projects/1/app-users');
        }));
  });

  describe('forms', () => {
    it('shows the count', () =>
      mockRoute('/projects/1')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { forms: 3 }).last())
        .respondWithData(() => testData.extendedForms.createPast(3).sorted())
        .afterResponses(app => {
          const items = app.find(SummaryItem);
          items.length.should.equal(2);
          const heading = items[1].first('.summary-item-heading').text().trim();
          heading.should.equal('3');
        }));

    it('scrolls down the page after a click', () =>
      mockRoute('/projects/1', { attachToDocument: true })
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() => testData.extendedForms.createPast(1).sorted())
        .afterResponses(app => {
          window.pageYOffset.should.equal(0);
          return trigger.click(app.find('.summary-item-icon-container')[1]);
        })
        // Wait for the animation to complete.
        .then(() => new Promise(resolve => {
          setTimeout(resolve, 400);
        }))
        .then(() => {
          window.pageYOffset.should.not.equal(0);
        }));
  });
});
