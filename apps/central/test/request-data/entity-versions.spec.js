import useEntityVersions from '../../src/request-data/entity-versions';

import createTestContainer from '../util/container';
import testData from '../data';
import { testRequestData } from '../util/request-data';

const createResource = () => {
  const { requestData } = createTestContainer({
    requestData: testRequestData([useEntityVersions], {
      entityVersions: testData.extendedEntityVersions.sorted()
    })
  });
  return requestData.localResources.entityVersions;
};

describe('useEntityVersions()', () => {
  describe('offline branches', () => {
    it('adds a branch property to each offline update', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 1 })
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 2 })
        .createPast(1, { branchId: 'b2', trunkVersion: 3, branchBaseVersion: 3 })
        .createPast(1, { branchId: 'b2', trunkVersion: 3, branchBaseVersion: 4 });
      const branches = createResource().map(version => version.branch?.id);
      branches.should.eql([undefined, 'b1', 'b1', 'b2', 'b2']);
    });

    it('stores information about the branch', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 1 })
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 2 })
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 3 });
      const entityVersions = createResource();
      entityVersions[1].branch.should.include({
        id: 'b1',
        length: 3,
        first: entityVersions[1],
        last: entityVersions[3]
      });
    });

    describe('single-updated branches', () => {
      it('does not add a branch property if branch has a single update', () => {
        testData.extendedEntities.createPast(1);
        testData.extendedEntityVersions
          .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 1 });
        const entityVersions = createResource();
        should.not.exist(entityVersions[1].branch);
      });

      it('adds a branch property if update was force-processed', () => {
        testData.extendedEntities.createPast(1);
        testData.extendedEntityVersions
          .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 2 });
        const entityVersions = createResource();
        entityVersions[1].branch.should.include({
          length: 1,
          first: entityVersions[1],
          last: entityVersions[1]
        });
      });
    });

    describe('lastContiguousWithTrunk', () => {
      it('equals last version if last version is contiguous with trunk version', () => {
        testData.extendedEntities.createPast(1);
        testData.extendedEntityVersions
          .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 1 })
          .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 2 });
        const entityVersions = createResource();
        entityVersions[1].branch.lastContiguousWithTrunk.should.equal(3);
      });

      it('equals 0 if there was an update from outside branch immediately after trunk version', () => {
        testData.extendedEntities.createPast(1);
        testData.extendedEntityVersions
          .createPast(1)
          .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 1, baseVersion: 1 })
          .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 2 });
        const entityVersions = createResource();
        entityVersions[2].branch.lastContiguousWithTrunk.should.equal(0);
      });

      it('equals a version in the middle if the branch started, then stopped being contiguous', () => {
        testData.extendedEntities.createPast(1);
        testData.extendedEntityVersions
          .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 1 })
          .createPast(1)
          .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 2, baseVersion: 2 });
        const entityVersions = createResource();
        entityVersions[1].branch.lastContiguousWithTrunk.should.equal(2);
      });
    });

    describe('entity was created offline, then immediately updated offline', () => {
      it('adds a branch property to the offline create', () => {
        testData.extendedEntities.createPast(1);
        testData.extendedEntityVersions
          .createPast(1, { branchId: 'b1', trunkVersion: null, branchBaseVersion: 1 })
          .createPast(1, { branchId: 'b1', trunkVersion: null, branchBaseVersion: 2 });
        const entityVersions = createResource();
        should.not.exist(entityVersions[0].branchId);
        should.exist(entityVersions[0].branch);
        entityVersions[0].branch.should.equal(entityVersions[1].branch);
        entityVersions[0].branch.should.include({
          length: 3,
          first: entityVersions[0],
          last: entityVersions[2],
          lastContiguousWithTrunk: 3
        });
      });

      describe('offline create was processed late', () => {
        it('does not add a branch to the offline create', () => {
          testData.extendedEntities
            .createPast(1, { branchId: 'b1', trunkVersion: null, branchBaseVersion: 1 });
          testData.extendedEntityVersions
            .createPast(1, { branchId: 'b1', trunkVersion: null, branchBaseVersion: 2 })
            .createPast(1);
          const entityVersions = createResource();
          entityVersions[0].branch.should.include({
            length: 2,
            first: entityVersions[0],
            last: entityVersions[1],
            lastContiguousWithTrunk: 2
          });
          should.not.exist(entityVersions[2].branchId);
        });

        it('adds a branch to the offline update even if it is the only update', () => {
          testData.extendedEntities
            .createPast(1, { branchId: 'b1', trunkVersion: null, branchBaseVersion: 1 });
          testData.extendedEntityVersions.createPast(1);
          const entityVersions = createResource();
          entityVersions[0].branch.should.include({
            length: 1,
            first: entityVersions[0],
            last: entityVersions[0],
            lastContiguousWithTrunk: 1
          });
        });
      });

      it('sets lastContiguousWithTrunk to 1 if offline create was followed by update from outside branch', () => {
        testData.extendedEntities.createPast(1);
        testData.extendedEntityVersions
          .createPast(1)
          .createPast(1, { branchId: 'b1', trunkVersion: null, branchBaseVersion: 1, baseVersion: 1 })
          .createPast(1, { branchId: 'b1', trunkVersion: null, branchBaseVersion: 2 });
        const entityVersions = createResource();
        entityVersions[0].branch.should.include({
          length: 3,
          first: entityVersions[0],
          last: entityVersions[3],
          lastContiguousWithTrunk: 1
        });
      });
    });
  });
});
