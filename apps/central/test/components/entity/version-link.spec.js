import { RouterLinkStub } from '@vue/test-utils';

import EntityVersionLink from '../../../src/components/entity/version-link.vue';

import testData from '../../data';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(EntityVersionLink, {
  props: {
    uuid: testData.extendedEntities.last().uuid,
    version: testData.extendedEntityVersions.last()
  },
  global: {
    provide: {
      projectId: '1',
      datasetName: testData.extendedDatasets.last().name
    }
  },
  container: { router: mockRouter('/') }
});

describe('EntityVersionLink', () => {
  it('links to the correct location', () => {
    testData.extendedDatasets.createPast(1, { name: 'á' });
    testData.extendedEntities.createPast(1, { uuid: 'e' });
    testData.extendedEntityVersions.createPast(1);
    const { to } = mountComponent().getComponent(RouterLinkStub).props();
    to.should.equal('/projects/1/entity-lists/%C3%A1/entities/e#v2');
  });

  it('shows the correct text if the entity source is the API', () => {
    testData.extendedUsers.createPast(1, { displayName: 'Alice' });
    testData.extendedEntities.createPast(1);
    mountComponent().text().should.equal('Update by Alice');
  });

  it('shows the filename and actor if the entity source is bulk upload', () => {
    testData.extendedUsers.createPast(1, { displayName: 'Alice' });
    testData.extendedEntities.createPast(1, {
      source: { name: 'my_file.csv', size: 100 } // size not used
    });
    mountComponent().text().should.equal('File my_file.csv upload by Alice');
  });

  describe('entity source is a submission', () => {
    it('shows the instance name if the submission has one', () => {
      const { submission } = testData.extendedEntities
        .createSourceSubmission('submission.create', {
          meta: { instanceName: 'Some Name' }
        });
      testData.extendedEntities.createPast(1, {
        source: { submission }
      });
      mountComponent().text().should.equal('Submission Some Name');
    });

    it('shows the instance ID if the submission has no instance name', () => {
      const { submission } = testData.extendedEntities
        .createSourceSubmission('submission.create', { instanceId: 's' });
      testData.extendedEntities.createPast(1, {
        source: { submission }
      });
      mountComponent().text().should.equal('Submission s');
    });

    it('falls back to the instance ID if submission deleted', () => {
      // Final argument about source submission: deleted=true
      const { submission } = testData.extendedEntities
        .createSourceSubmission('submission.create', { instanceId: 'x' }, true);
      testData.extendedEntities.createPast(1, {
        source: { submission }
      });
      mountComponent().text().should.equal('Submission x');
    });
  });
});
