import ProjectIntroduction from '../../../lib/components/project/introduction.vue';
import testData from '../../data';
import { mockLogin } from '../../session';
import { mockRoute } from '../../http';
import { trigger } from '../../event';

describe('ProjectIntroduction', () => {
  beforeEach(mockLogin);

  let app;
  beforeEach(() => mockRoute('/')
    .respondWithData(() => testData.extendedProjects
      .createPast(1, { name: 'Default Project', forms: 0 })
      .sorted())
    .respondWithData(() => testData.administrators.sorted())
    .afterResponses(component => {
      app = component;
    }));

  it('does not show the modal initially', () => {
    app.first(ProjectIntroduction).getProp('state').should.be.false();
  });

  it('shows a link to toggle the modal', () => {
    const a = app.first('#project-list-table td').find('a');
    a.length.should.equal(2);
    a[1].text().trim().should.equal('What are Projects?');
  });

  describe('after the link is clicked', () => {
    beforeEach(() =>
      trigger.click(app.first('#project-list-table td').find('a')[1]));

    it('shows the modal', () => {
      app.first(ProjectIntroduction).getProp('state').should.be.true();
    });

    // Remove this test after removing the link for "What happened to my
    // Forms?".
    it('hides the third paragraph', () => {
      const p = app.first(ProjectIntroduction).find('p');
      const display = p.map(wrapper => wrapper.element.style.display);
      display.should.eql(['', '', 'none', '']);
    });
  });
});
