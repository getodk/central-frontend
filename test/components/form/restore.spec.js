import FormRestore from '../../../src/components/form/restore.vue';

import Form from '../../../src/presenters/form';
import { ago } from '../../../src/util/date-time';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormRestore', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedProjects.createPast(1);
  });

  it('toggles the modal', () =>
    load('/projects/1', {}, {
      deletedForms: () => [
        new Form({ xmlFormId: '15_days_ago', deletedAt: ago({ days: 15 }).toISO() })
      ]
    })
      .testModalToggles({
        modal: FormRestore,
        show: '.form-trash-row .actions .form-trash-row-restore-button',
        hide: '.btn-link'
      }));

  it('implements some standard button things', () =>
    mockHttp()
      .mount(FormRestore, {
        propsData: {
          state: true,
          form: new Form({ xmlFormId: 'a', projectId: 1 })
        }
      })
      .testStandardButton({
        button: '.btn-danger',
        disabled: ['.btn-link'],
        modal: true
      }));
});
