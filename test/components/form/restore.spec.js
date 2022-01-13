import { omit } from 'ramda';

import FormRestore from '../../../src/components/form/restore.vue';
import FormTrashRow from '../../../src/components/form/trash-row.vue';
import FormRow from '../../../src/components/form/row.vue';

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

  // TODO: check when restore button is disabled because of conflict (or check this in proj. overview)

  describe('after a successful response', () => {
    const restore = (trashedForms, restoreId) => {
      let updatedTrash = null;

      return load('/projects/1', {}, {
        deletedForms: () => Object.values(trashedForms)
      })
        .afterResponses(component => {
          component.findAllComponents(FormRow).length.should.equal(testData.extendedForms.size);
          component.findAllComponents(FormTrashRow).length.should.equal(Object.keys(trashedForms).length);
        })
        .request(async (app) => {
          await app.get(`[data-form-id="${restoreId}"]`).trigger('click');
          return app.get('#form-restore .btn-danger').trigger('click');
        })
        .respondWithData(() => {
          testData.extendedForms.createPast(1, trashedForms[restoreId]);
          updatedTrash = omit([restoreId], trashedForms);
          return { success: true };
        })
        .respondWithData(() => Object.values(updatedTrash))
        .respondWithData(() => testData.extendedForms.sorted());
    };

    it('shows non-empty active and trash lists updating correctly', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedForms.createPast(1);
      testData.extendedForms.createPast(1);
      const trashedForms = {
        111: new Form({ xmlFormId: '111', id: 111, name: 'Delete Me', projectId: 1, deletedAt: ago({ days: 15 }).toISO() }),
        222: new Form({ xmlFormId: '222', id: 222, name: 'Another Deleted Form', projectId: 1, deletedAt: ago({ days: 10 }).toISO() })
      };
      const app = await restore(trashedForms, 111);
      app.findAllComponents(FormTrashRow).length.should.equal(1);
      app.findAllComponents(FormRow).length.should.equal(4);
    });

    // TODO: check when trash becomes empty
    // or active forms starts off empty but then appears

    it('shows a success message', async () => {
      const trashedForms = {
        111: new Form({ xmlFormId: '111', id: 111, name: 'Delete Me', projectId: 1, deletedAt: ago({ days: 15 }).toISO() }),
        222: new Form({ xmlFormId: '222', id: 222, name: 'Another Deleted Form', projectId: 1, deletedAt: ago({ days: 10 }).toISO() })
      };
      const app = await restore(trashedForms, 111);
      app.findAllComponents(FormRow).length.should.equal(1);
      app.findAllComponents(FormTrashRow).length.should.equal(1);
      app.should.alert('success', 'The Form “Delete Me” has been undeleted.');
    });

    it('sends the correct requests', async () => {
      const trashedForms = {
        111: new Form({ xmlFormId: '111', id: 111, name: 'Delete Me', projectId: 1, deletedAt: ago({ days: 15 }).toISO() })
      };
      return restore(trashedForms, 111)
        .testRequests([
          { method: 'POST', url: '/v1/projects/1/forms/111/restore' },
          { method: 'GET', url: '/v1/projects/1/forms?deleted=true', extended: true },
          { method: 'GET', url: '/v1/projects/1/forms', extended: true }
        ]);
    });
  });
});
