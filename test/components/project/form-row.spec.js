import { RouterLinkStub } from '@vue/test-utils';

import ProjectFormRow from '../../../src/components/project/form-row.vue';

import Form from '../../../src/presenters/form';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(ProjectFormRow, {
  props: {
    form: new Form(testData.extendedForms.last())
  },
  container: { router: mockRouter('/projects/1') }
});

describe('ProjectFormRow', () => {
  beforeEach(mockLogin);

  it('renders the form name correctly', () => {
    // TODO
    /*
    testData.extendedForms.createPast(1, { name: 'My Form' });
    const link = mountComponent().getComponent(RouterLinkStub);
    link.text().should.equal('My Form');
    link.props().to.should.equal('/projects/1');
    */
  });

  it('shows the encrypted label for encrypted forms', () => {
    // TODO
  });

  it('sorts the right thing when there are zero forms', () => {
    // TODO
  });

  it('shows the correct number of forms if there are only a few', () => {
    // TODO
  });

  it('shows the correct number of forms if there are a lot and some should be hidden', () => {
    // TODO
  });

  it('expands the forms to show more forms', () => {
    // TODO
  });

  it('sorts the forms by the same sort function', () => {
    // TODO
  });

  it('shows different forms depending on cutoff and sort func', () => {
    // TODO
  });
});
