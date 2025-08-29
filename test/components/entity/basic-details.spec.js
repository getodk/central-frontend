import ActorLink from '../../../src/components/actor-link.vue';
import DateTime from '../../../src/components/date-time.vue';
import EntityBasicDetails from '../../../src/components/entity/basic-details.vue';
import SubmissionLink from '../../../src/components/submission/link.vue';

import useEntity from '../../../src/request-data/entity';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => {
  const entity = testData.extendedEntities.last();
  return mount(EntityBasicDetails, {
    global: {
      provide: { projectId: '1' }
    },
    container: {
      requestData: testRequestData([useEntity], {
        entity,
        audits: testData.extendedAudits.sorted()
      }),
      router: mockRouter(`/projects/1/entity-lists/trees/entities/${entity.uuid}`)
    }
  });
};

describe('EntityBasicDetails', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
  });

  it('shows the entity ID', () => {
    testData.extendedEntities.createPast(1, { uuid: 'abc' });
    mountComponent().get('dd').text().should.equal('abc');
  });

  describe('creating submission', () => {
    const createEntityFromSubmission = ({
      deleted: submissionDeleted = false
    } = {}) => {
      const submission = testData.extendedSubmissions
        .createPast(1, { instanceId: 's' })
        .last();
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      const details = {
        entity: { uuid: 'e' },
        source: {}
      };
      if (!submissionDeleted)
        details.source = { submission: { ...submission, xmlFormId: 'f' } }; // Use entire submission, augmented with form id
      else {
        // If submission is deleted, these are the only fields we pass through in the audit log
        const { instanceId, submitter, createdAt } = submission;
        details.source = { submission: { instanceId, submitter, createdAt } };
      }
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details
      });
    };

    it('shows creating submission if there is a submission in audit log', () => {
      createEntityFromSubmission();
      const component = mountComponent();
      const dd = component.get('#entity-basic-details-creating-submission');
      const link = dd.getComponent(SubmissionLink);
      link.props().should.include({ projectId: '1', xmlFormId: 'f' });
      link.props().submission.instanceId.should.equal('s');
    });

    describe('submission was deleted', () => {
      it('does not link to the submission', () => {
        createEntityFromSubmission({ deleted: true });
        const component = mountComponent();
        const dd = component.get('#entity-basic-details-creating-submission');
        dd.findComponent(SubmissionLink).exists().should.be.false;
      });

      it('shows a trash icon with a tooltip', async () => {
        createEntityFromSubmission({ deleted: true });
        const component = mountComponent();
        const dd = component.get('#entity-basic-details-creating-submission');
        const icon = dd.get('.icon-trash');
        await icon.should.have.tooltip('This Submission has been deleted.');
      });

      it('shows the instance ID', () => {
        createEntityFromSubmission({ deleted: true });
        const component = mountComponent();
        const dd = component.get('#entity-basic-details-creating-submission');
        const spans = dd.findAll('span');
        spans.length.should.equal(3);
        spans[1].text().should.equal('s');
      });
    });

    it('does not remove creating submission while activity feed is being refreshed', () => {
      createEntityFromSubmission();
      return load('/projects/1/entity-lists/trees/entities/e', { root: false })
        .afterResponses(component => {
          const dd = component.get('#entity-basic-details-creating-submission');
          dd.text().should.equal('s');
        })
        .request(async (component) => {
          await component.get('#entity-data-update-button').trigger('click');
          const form = component.get('#entity-update form');
          await form.get('textarea').setValue('Updated Entity');
          return form.trigger('submit');
        })
        .beforeEachResponse(component => {
          const dd = component.get('#entity-basic-details-creating-submission');
          dd.text().should.equal('s');
        })
        .respondWithData(() => {
          testData.extendedEntityVersions.createNew({
            label: 'Updated Entity'
          });
          testData.extendedAudits.createPast(1, {
            action: 'entity.update.version',
            details: { source: {} }
          });
          return testData.standardEntities.last();
        })
        .respondWithData(() => testData.extendedAudits.sorted())
        .respondWithData(() => testData.extendedEntityVersions.sorted())
        .afterResponses(component => {
          const dd = component.get('#entity-basic-details-creating-submission');
          dd.text().should.equal('s');
        });
    });
  });

  describe('entity created using single entity API', () => {
    it('does not show any block about entity creation', () => {
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details: {
          entity: { uuid: 'e' }
        }
      });
      const component = mountComponent();
      component.findAll('dd').length.should.equal(3);
    });

    it('does not show creating submission for entity created using API', () => {
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details: {
          entity: { uuid: 'e' }
        }
      });
      const component = mountComponent();
      const dd = component.find('#entity-basic-details-creating-submission');
      dd.exists().should.be.false;
    });
  });

  describe('entity created using bulk upload', () => {
    it('shows the creating source as the word upload', () => {
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details: {
          source: { name: 'my_file.csv' }
        }
      });
      const component = mountComponent();
      const dd = component.find('#entity-basic-details-creating-source');
      dd.text().should.equal('Upload');
    });
  });

  it('shows the creation date', () => {
    const { createdAt } = testData.extendedEntities.createPast(1).last();
    mountComponent().getComponent(DateTime).props().iso.should.equal(createdAt);
  });

  it('shows the creator', () => {
    testData.extendedEntities.createPast(1);
    const { actor } = mountComponent().getComponent(ActorLink).props();
    actor.displayName.should.equal('Alice');
  });
});
