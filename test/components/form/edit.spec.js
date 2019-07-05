import FormEdit from '../../../src/components/form/edit.vue';
import Spinner from '../../../src/components/spinner.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { trigger } from '../../event';

// Returns the spinner associated with the currently selected radio.
const spinnerOfSelectedState = (formEdit) => {
  const radios = formEdit.find('.radio');
  const spinners = formEdit.find(Spinner);
  for (let i = 0; i < radios.length; i += 1) {
    const input = radios[i].first('input');
    if (input.getAttribute('value') === formEdit.data().state)
      return spinners[i];
  }
  throw new Error('spinner not found');
};

describe('FormEdit', () => {
  beforeEach(mockLogin);

  describe('after selection', () => {
    it('disables fieldset', () =>
      mockHttp()
        .mount(FormEdit, {
          propsData: { projectId: '1' },
          requestData: {
            form: testData.extendedForms.createPast(1, { state: 'open' }).last()
          }
        })
        .request(component =>
          trigger.check(component, 'input[value="closing"]'))
        .beforeAnyResponse(component => {
          const disabled = component.first('fieldset').getAttribute('disabled');
          disabled.should.equal('disabled');
        })
        .respondWithData(() => {
          testData.extendedForms.update(testData.extendedForms.last(), {
            state: 'closing'
          });
          return testData.standardForms.last();
        }));

    it('shows a spinner', () =>
      mockHttp()
        .mount(FormEdit, {
          propsData: { projectId: '1' },
          requestData: {
            form: testData.extendedForms
              .createPast(1, { state: 'closing' })
              .last()
          }
        })
        .request(component =>
          trigger.check(component, 'input[value="closed"]'))
        .beforeAnyResponse(component => {
          spinnerOfSelectedState(component).getProp('state').should.be.true();
        })
        .respondWithData(() => {
          testData.extendedForms.update(testData.extendedForms.last(), {
            state: 'closed'
          });
          return testData.standardForms.last();
        })
        .afterResponse(component => {
          spinnerOfSelectedState(component).getProp('state').should.be.false();
        }));

    it('shows a success message', () =>
      mockRoute('/projects/1/forms/f/settings')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() => testData.extendedForms
          .createPast(1, { xmlFormId: 'f', state: 'closed' })
          .last())
        .respondWithData(() => testData.extendedFormAttachments.sorted())
        .complete()
        .request(app => trigger.check(app, '#form-edit input[value="open"]'))
        .respondWithData(() => {
          testData.extendedForms.update(testData.extendedForms.last(), {
            state: 'open'
          });
          return testData.standardForms.last();
        })
        .afterResponse(app => {
          app.should.alert('success');
        }));
  });
});
