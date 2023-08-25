import { RouterLinkStub } from '@vue/test-utils';

import ActorLink from '../../../src/components/actor-link.vue';
import DateTime from '../../../src/components/date-time.vue';
import EntityBasicDetails from '../../../src/components/entity/basic-details.vue';

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
      deleted: submissionDeleted = false,
      ...submissionOptions
    } = {}) => {
      const submission = testData.extendedSubmissions
        .createPast(1, { instanceId: 's', ...submissionOptions })
        .last();
      const submissionCreate = testData.extendedAudits
        .createPast(1, {
          action: 'submission.create',
          details: { instanceId: submission.instanceId }
        })
        .last();

      testData.extendedEntities.createPast(1, { uuid: 'e' });
      const details = {
        entity: { uuid: 'e' },
        submissionCreate
      };
      if (!submissionDeleted)
        details.submission = { ...submission, xmlFormId: 'f' };
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details
      });
    };

    it('shows creating submission if there is a submission in audit log', () => {
      createEntityFromSubmission();
      const component = mountComponent();
      const dd = component.find('#entity-basic-details-creating-submission');
      dd.exists().should.be.true();
    });

    it('shows the instance name if the submission has one', () => {
      createEntityFromSubmission({
        meta: { instanceName: 'My Submission' }
      });
      const component = mountComponent();
      const dd = component.get('#entity-basic-details-creating-submission');
      dd.text().should.equal('My Submission');
    });

    it('falls back to showing the instance ID', () => {
      createEntityFromSubmission();
      const component = mountComponent();
      const dd = component.get('#entity-basic-details-creating-submission');
      dd.text().should.equal('s');
    });

    it('links to the submission', () => {
      createEntityFromSubmission();
      const component = mountComponent();
      const dd = component.get('#entity-basic-details-creating-submission');
      const { to } = dd.getComponent(RouterLinkStub).props();
      to.should.equal('/projects/1/forms/f/submissions/s');
    });

    describe('submission was deleted', () => {
      it('does not link to the submission', () => {
        createEntityFromSubmission({ deleted: true });
        const component = mountComponent();
        const dd = component.get('#entity-basic-details-creating-submission');
        dd.findComponent(RouterLinkStub).exists().should.be.false();
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
          const { currentVersion } = testData.extendedEntities.last();
          testData.extendedEntities.update(-1, {
            currentVersion: { ...currentVersion, label: 'Updated Entity' }
          });
          testData.extendedAudits.createPast(1, {
            action: 'entity.update.version'
          });
          return testData.standardEntities.last();
        })
        .respondWithData(() => testData.extendedAudits.sorted())
        .respondWithData(() => [])
        .afterResponses(component => {
          const dd = component.get('#entity-basic-details-creating-submission');
          dd.text().should.equal('s');
        });
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
      dd.exists().should.be.false();
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
