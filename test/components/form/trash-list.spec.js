import FormTrashList from '../../../src/components/form/trash-list.vue';
import FormTrashRow from '../../../src/components/form/trash-row.vue';

import Form from '../../../src/presenters/form';

import testData from '../../data';
import { mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormTrashList', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedProjects.createPast(1);
  });

  describe('requests', () => {
    it('requests deletedForms if not yet in store', async () =>
      mockHttp()
        .mount(FormTrashList, {
          requestData: {
            project: testData.extendedProjects.last()
          }
        })
        .respondWithData(() => []));

    it('does not request deletedForms if in store already', async () =>
      mockHttp()
        .mount(FormTrashList, {
          requestData: {
            project: testData.extendedProjects.last(),
            deletedForms: []
          }
        }));
  });

  it('does not render component if there are no deleted forms', async () =>
    mockHttp()
      .mount(FormTrashList, {
        requestData: {
          project: testData.extendedProjects.last()
        }
      })
      .respondWithData(() => [])
      .afterResponses(component => {
        component.find('div').exists().should.be.false();
      }));

  it('shows the correct number of rows', async () =>
    mockHttp()
      .mount(FormTrashList, {
        requestData: {
          project: testData.extendedProjects.last(),
          forms: testData.extendedForms.sorted()
        }
      })
      .respondWithData(() => [
        new Form({ xmlFormId: 'a', deletedAt: new Date().toISOString() }),
        new Form({ xmlFormId: 'b', deletedAt: new Date().toISOString() })
      ])
      .afterResponses(component => {
        component.findAllComponents(FormTrashRow).length.should.equal(2);
      }));

  it('shows the correct headers', async () =>
    mockHttp()
      .mount(FormTrashList, {
        requestData: {
          project: testData.extendedProjects.last(),
          forms: testData.extendedForms.sorted()
        }
      })
      .respondWithData(() => [
        new Form({ xmlFormId: 'a', deletedAt: new Date().toISOString() })
      ])
      .afterResponses(component => {
        component.get('#trash-list-title').text().should.equal('Trash');
        component.get('#trash-list-count').text().should.equal('(1)');
        component.get('#trash-list-note').text().should.equal('Forms and Form-related data are deleted after 30 days in the Trash');
      }));
});
