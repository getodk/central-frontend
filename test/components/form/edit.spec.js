import Form from '../../../lib/presenters/form';
import FormEdit from '../../../lib/components/form/edit.vue';
import Spinner from '../../../lib/components/spinner.vue';
import faker from '../../faker';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { trigger } from '../../util';

const selectDifferentState = (formEdit) => {
  const inputs = formEdit.find('input')
    .filter(input => input.getAttribute('value') !== formEdit.data().state);
  return trigger.change(faker.random.arrayElement(inputs));
};
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
            form: new Form(testData.extendedForms.createPast(1).last())
          }
        })
        .request(selectDifferentState)
        .beforeAnyResponse(component => {
          const disabled = component.first('fieldset').getAttribute('disabled');
          disabled.should.equal('disabled');
        })
        .respondWithSuccess());

    it('shows a spinner', () =>
      mockHttp()
        .mount(FormEdit, {
          propsData: { projectId: '1' },
          requestData: {
            form: new Form(testData.extendedForms.createPast(1).last())
          }
        })
        .request(selectDifferentState)
        .beforeAnyResponse(component => {
          spinnerOfSelectedState(component).getProp('state').should.be.true();
        })
        .respondWithSuccess()
        .afterResponse(component => {
          spinnerOfSelectedState(component).getProp('state').should.be.false();
        }));

    it('shows a success message', () =>
      mockRoute('/projects/1/forms/x/settings')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() =>
          testData.extendedForms.createPast(1, { xmlFormId: 'x' }).last())
        .respondWithData(() => testData.extendedFormAttachments.sorted())
        .complete()
        .request(app => selectDifferentState(app.first(FormEdit)))
        .respondWithSuccess()
        .afterResponse(app => app.should.alert('success')));
  });
});
