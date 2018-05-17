/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import FormEdit from '../../../lib/components/form/edit.vue';
import FormSettings from '../../../lib/components/form/settings.vue';
import Spinner from '../../../lib/components/spinner.vue';
import faker from '../../faker';
import testData from '../../data';
import { mockHttp } from '../../http';
import { mockLogin } from '../../session';
import { trigger } from '../../util';

const propsData = () => {
  const props = { form: testData.simpleForms.createPast(1).last() };
  return { propsData: props };
};
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
    it('disables inputs', () =>
      mockHttp()
        .mount(FormEdit, propsData())
        .request(selectDifferentState)
        .respondWithSuccess()
        .beforeEachResponse(component =>
          component.find('input').should.matchEach(input =>
            input.getAttribute('disabled').should.not.be.empty())));

    it('shows a spinner', () =>
      mockHttp()
        .mount(FormEdit, propsData())
        .request(selectDifferentState)
        .respondWithSuccess()
        .beforeEachResponse(component =>
          spinnerOfSelectedState(component).getProp('state').should.be.true())
        .afterResponse(component =>
          spinnerOfSelectedState(component).getProp('state').should.be.false()));

    it('shows a success message', () =>
      mockHttp()
        .mount(FormSettings, propsData())
        .request(component => selectDifferentState(component.first(FormEdit)))
        .respondWithSuccess()
        .afterResponse(component => component.should.alert('success')));
  });
});
