import DeletePropertyError from '../../../../src/components/dataset/overview/delete-property-error.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';
import { mockRouter } from '../../../util/router';

const errorWithEntities = (totalCount, entities) => ({
  code: 409.22,
  message: 'Cannot delete property',
  details: {
    propertyName: 'height',
    prerequisites: {
      nonEmptyEntities: {
        details: {
          totalCount,
          entities
        }
      },
      dependentForms: null
    }
  }
});

const errorWithForms = (forms) => ({
  code: 409.22,
  message: 'Cannot delete property',
  details: {
    propertyName: 'height',
    prerequisites: {
      nonEmptyEntities: null,
      dependentForms: {
        details: { forms }
      }
    }
  }
});

const errorWithBoth = (totalCount, entities, forms) => ({
  code: 409.22,
  message: 'Cannot delete property',
  details: {
    propertyName: 'height',
    prerequisites: {
      nonEmptyEntities: {
        details: {
          totalCount,
          entities
        }
      },
      dependentForms: {
        details: { forms }
      }
    }
  }
});

const mountComponent = (options = undefined) =>
  mount(DeletePropertyError, mergeMountOptions(options, {
    props: {
      state: true,
      projectId: 1,
      datasetName: 'trees',
      errorObject: errorWithEntities(1, [{ uuid: 'abc123', label: 'Entity 1' }])
    },
    container: {
      router: mockRouter('/')
    }
  }));

describe('DeletePropertyError', () => {
  it('shows the modal title', () => {
    const component = mountComponent();
    component.get('.modal-title').text().should.equal('Delete Property');
  });

  it('shows the property name in the intro message', () => {
    const component = mountComponent();
    const intro = component.get('.modal-introduction p').text();
    intro.should.contain('height');
  });

  describe('nonEmptyEntities only', () => {
    it('shows entity count in intro message', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithEntities(2, [
            { uuid: 'abc123', label: 'Entity 1' },
            { uuid: 'def456', label: 'Entity 2' }
          ])
        }
      });
      const intro = component.get('.modal-introduction p').text();
      intro.should.contain('2 Entities');
    });

    it('shows singular entity text for 1 entity', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithEntities(1, [{ uuid: 'abc123', label: 'Entity 1' }])
        }
      });
      const intro = component.get('.modal-introduction p').text();
      intro.should.contain('1 Entity');
    });

    it('shows entities details section', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithEntities(2, [
            { uuid: 'abc123', label: 'Entity 1' },
            { uuid: 'def456', label: 'Entity 2' }
          ])
        }
      });
      const details = component.findAll('details');
      details.length.should.equal(1);
      details[0].get('summary').text().should.contain('Set in 2 Entities');
    });

    it('links to entities', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithEntities(1, [{ uuid: 'abc123', label: 'Entity 1' }])
        }
      });
      const link = component.get('details ul li').getComponent('a');
      link.text().should.equal('Entity 1');
      link.props().to.should.equal('/projects/1/entity-lists/trees/entities/abc123');
    });

    it('shows "more entities" message when totalCount > 3', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithEntities(5, [
            { uuid: 'a', label: 'Entity 1' },
            { uuid: 'b', label: 'Entity 2' },
            { uuid: 'c', label: 'Entity 3' }
          ])
        }
      });
      const more = component.get('.more-entities');
      more.text().should.equal('and 2 more Entities');
    });

    it('shows singular "more entity" message when only 1 more', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithEntities(4, [
            { uuid: 'a', label: 'Entity 1' },
            { uuid: 'b', label: 'Entity 2' },
            { uuid: 'c', label: 'Entity 3' }
          ])
        }
      });
      const more = component.get('.more-entities');
      more.text().should.equal('and 1 more Entity');
    });

    it('does not show "more entities" message when totalCount <= 3', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithEntities(3, [
            { uuid: 'a', label: 'Entity 1' },
            { uuid: 'b', label: 'Entity 2' },
            { uuid: 'c', label: 'Entity 3' }
          ])
        }
      });
      component.find('.more-entities').exists().should.be.false;
    });
  });

  describe('dependentForms only', () => {
    it('shows form count in intro message', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithForms([
            { xmlFormId: 'form1', formName: 'Form One' },
            { xmlFormId: 'form2', formName: 'Form Two' }
          ])
        }
      });
      const intro = component.get('.modal-introduction p').text();
      intro.should.contain('2 Forms');
    });

    it('shows singular form text for 1 form', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithForms([{ xmlFormId: 'form1', formName: 'Form One' }])
        }
      });
      const intro = component.get('.modal-introduction p').text();
      intro.should.contain('1 Form');
    });

    it('shows forms details section', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithForms([
            { xmlFormId: 'form1', formName: 'Form One' },
            { xmlFormId: 'form2', formName: 'Form Two' }
          ])
        }
      });
      const details = component.findAll('details');
      details.length.should.equal(1);
      details[0].get('summary').text().should.contain('Set by 2 Forms');
    });

    it('links to form draft', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithForms([{ xmlFormId: 'tree_survey', formName: 'Tree Survey' }])
        }
      });
      const link = component.get('details ul li').getComponent('a');
      link.text().should.equal('Tree Survey');
      link.props().to.should.equal('/projects/1/forms/tree_survey/draft');
    });

    it('does not show entities section', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithForms([{ xmlFormId: 'form1', formName: 'Form One' }])
        }
      });
      component.find('.more-entities').exists().should.be.false;
    });
  });

  describe('both nonEmptyEntities and dependentForms', () => {
    it('shows both counts in intro message with "and"', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithBoth(
            2,
            [{ uuid: 'a', label: 'Entity 1' }, { uuid: 'b', label: 'Entity 2' }],
            [{ xmlFormId: 'form1', formName: 'Form One' }]
          )
        }
      });
      const intro = component.get('.modal-introduction p').text();
      intro.should.contain('2 Entities');
      intro.should.contain('and');
      intro.should.contain('1 Form');
    });

    it('shows both details sections', () => {
      const component = mountComponent({
        props: {
          errorObject: errorWithBoth(
            1,
            [{ uuid: 'a', label: 'Entity 1' }],
            [{ xmlFormId: 'form1', formName: 'Form One' }]
          )
        }
      });
      const details = component.findAll('details');
      details.length.should.equal(2);
      details[0].get('summary').text().should.contain('Set in 1 Entity');
      details[1].get('summary').text().should.contain('Set by 1 Form');
    });
  });
});
