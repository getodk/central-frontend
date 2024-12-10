import { RouterLinkStub } from '@vue/test-utils';

import FormLink from '../../../src/components/form/link.vue';
import LinkIfCan from '../../../src/components/link-if-can.vue';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';

const mountComponent = (options = undefined) =>
  mount(FormLink, mergeMountOptions(options, {
    props: { form: testData.extendedForms.last() },
    container: {
      router: mockRouter('/projects/1'),
      requestData: { project: testData.extendedProjects.last() }
    }
  }));

describe('FormLink', () => {
  describe('text', () => {
    it("shows the form's name if it has one", () => {
      testData.extendedForms.createPast(1, { name: 'My Form' });
      mountComponent().text().should.equal('My Form');
    });

    it('shows the xmlFormId if the form does not have a name', () => {
      testData.extendedForms.createPast(1);
      mountComponent().text().should.equal('f');
    });
  });

  describe('link', () => {
    describe('administrator', () => {
      beforeEach(mockLogin);

      it('links to form overview for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
        const { to } = mountComponent().getComponent(LinkIfCan).props();
        to.should.equal('/projects/1/forms/a%20b');
      });

      it('links to .../draft for a form without a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
        const { to } = mountComponent().getComponent(LinkIfCan).props();
        to.should.equal('/projects/1/forms/a%20b/draft');
      });
    });

    describe('project viewer', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      });

      it('links to .../submissions for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
        const { to } = mountComponent().getComponent(LinkIfCan).props();
        to.should.equal('/projects/1/forms/a%20b/submissions');
      });

      it('links to .../draft/testing for form without published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
        const { to } = mountComponent().getComponent(LinkIfCan).props();
        to.should.equal('/projects/1/forms/a%20b/draft/testing');
      });
    });

    describe('Data Collector', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
        testData.extendedForms.createPast(1, { name: 'My Form' });
      });

      it('does not render a link', () => {
        const component = mountComponent();
        component.find('a').exists().should.be.false;
        component.text().should.equal('My Form');
      });
    });
  });

  it('uses the to prop', () => {
    testData.extendedForms.createPast(1, { name: 'My Form' });
    const component = mountComponent({
      props: { to: '/users' }
    });
    component.findComponent(LinkIfCan).exists().should.be.false;
    const link = component.findComponent(RouterLinkStub);
    link.exists().should.be.true;
    link.props().to.should.equal('/users');
    link.text().should.equal('My Form');
  });
});
