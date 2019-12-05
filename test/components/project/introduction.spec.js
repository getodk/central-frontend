import ProjectIntroduction from '../../../src/components/project/introduction.vue';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRoute } from '../../util/http';
import { trigger } from '../../util/event';

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

  it('shows the modal after the link is clicked', () =>
    trigger.click(app.first('#project-list-table td').find('a')[1]).then(() => {
      app.first(ProjectIntroduction).getProp('state').should.be.true();
    }));
});
