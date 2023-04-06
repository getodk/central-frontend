import ActorLink from '../../../src/components/actor-link.vue';
import DateTime from '../../../src/components/date-time.vue';
import EntityBasicDetails from '../../../src/components/entity/basic-details.vue';

import useEntity from '../../../src/request-data/entity';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => {
  const entity = testData.extendedEntities.last();
  return mount(EntityBasicDetails, {
    container: {
      requestData: testRequestData([useEntity], { entity }),
      router: mockRouter(`/projects/1/datasets/trees/entities/${entity.uuid}`)
    }
  });
};

describe('EntityBasicDetails', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
  });

  it('shows the entity ID', async () => {
    testData.extendedEntities.createPast(1, { uuid: 'foo' });
    mountComponent().get('dd').text().should.equal('foo');
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
