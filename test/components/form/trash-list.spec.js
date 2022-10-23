import FormTrashList from '../../../src/components/form/trash-list.vue';
import FormTrashRow from '../../../src/components/form/trash-row.vue';

import useProject from '../../../src/request-data/project';
import { ago } from '../../../src/util/date-time';

import testData from '../../data';
import { mergeMountOptions } from '../../util/lifecycle';
import { mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { testRequestData } from '../../util/request-data';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  container: {
    requestData: testRequestData([useProject], {
      project: testData.extendedProjects.last(),
      forms: testData.extendedForms.sorted()
    })
  }
});

describe('FormTrashList', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedProjects.createPast(1);
  });

  describe('requests', () => {
    it('requests requestData.deletedForms if it does not yet have data', () =>
      mockHttp()
        .mount(FormTrashList, mountOptions())
        .respondWithData(() => []));

    it('does not request requestData.deletedForms if has data already', () =>
      mockHttp()
        .mount(FormTrashList, mountOptions({
          container: {
            requestData: { deletedForms: [] }
          }
        }))
        .testNoRequest());
  });

  it('does not render component if there are no deleted forms', () =>
    mockHttp()
      .mount(FormTrashList, mountOptions())
      .respondWithData(() => [])
      .afterResponses(component => {
        component.find('div').exists().should.be.false();
      }));

  it('shows the correct number of rows', () =>
    mockHttp()
      .mount(FormTrashList, mountOptions())
      .respondWithData(() => [
        { xmlFormId: 'a', deletedAt: new Date().toISOString() },
        { xmlFormId: 'b', deletedAt: new Date().toISOString() }
      ])
      .afterResponses(component => {
        component.findAllComponents(FormTrashRow).length.should.equal(2);
      }));

  it('shows the rows sorted with recently deleted on the bottom', () =>
    mockHttp()
      .mount(FormTrashList, mountOptions())
      .respondWithData(() => [
        { xmlFormId: '15_days_ago', deletedAt: ago({ days: 15 }).toISO() },
        { xmlFormId: '10_days_ago', deletedAt: ago({ days: 10 }).toISO() },
        { xmlFormId: '20_days_ago', deletedAt: ago({ days: 20 }).toISO() },
        { xmlFormId: '5_days_ago', deletedAt: ago({ days: 5 }).toISO() }
      ])
      .afterResponses(component => {
        const rows = component.findAllComponents(FormTrashRow);
        const formXmlIds = rows.map(row => row.find('.form-name').text());
        formXmlIds.should.eql(['20_days_ago', '15_days_ago', '10_days_ago', '5_days_ago']);
      }));

  it('shows the correct headers', () =>
    mockHttp()
      .mount(FormTrashList, mountOptions())
      .respondWithData(() => [{ xmlFormId: 'a', deletedAt: new Date().toISOString() }])
      .afterResponses(component => {
        component.get('#form-trash-list-title').text().should.equal('Trash');
        component.get('#form-trash-list-count').text().should.equal('(1)');
        component.get('#form-trash-list-note').text().should.equal('Forms and Form-related data are deleted after 30 days in the Trash');
      }));
});
