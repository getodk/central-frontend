import SubmissionReviewState from '../../../src/components/submission/review-state.vue';

import { mount } from '../../util/lifecycle';

const mountComponent = (props) => mount(SubmissionReviewState, { props });

describe('SubmissionReviewState', () => {
  it('renders correctly for null', () => {
    const component = mountComponent({ value: null });
    component.find('.icon-dot-circle-o').exists().should.be.true;
    component.text().should.equal('Received');
  });

  it('renders correctly for hasIssues', () => {
    const component = mountComponent({ value: 'hasIssues' });
    component.classes('hasIssues').should.be.true;
    component.find('.icon-comments').exists().should.be.true;
    component.text().should.equal('Has issues');
  });

  it('renders correctly for edited', () => {
    const component = mountComponent({ value: 'edited' });
    component.classes('edited').should.be.true;
    component.find('.icon-pencil').exists().should.be.true;
    component.text().should.equal('Edited');
  });

  it('renders correctly for approved', () => {
    const component = mountComponent({ value: 'approved' });
    component.classes('approved').should.be.true;
    component.find('.icon-check-circle').exists().should.be.true;
    component.text().should.equal('Approved');
  });

  it('renders correctly for rejected', () => {
    const component = mountComponent({ value: 'rejected' });
    component.classes('rejected').should.be.true;
    component.find('.icon-times-circle').exists().should.be.true;
    component.text().should.equal('Rejected');
  });
});
