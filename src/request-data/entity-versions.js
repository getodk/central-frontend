/*
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { useRequestData } from './index';

// Offline branch
class Branch {
  // firstUpdate is the first offline update (not create) to be processed from
  // the branch. entityRoot is the first version of the entity.
  constructor(firstUpdate, entityRoot) {
    if (firstUpdate.trunkVersion != null) {
      // The first version from the branch to be processed (not necessarily the
      // first in the original branch order)
      this.first = firstUpdate;

      // How many versions that have been processed are from the branch?
      this.length = 1;

      // Was this.first processed in branch order, or was it processed before an
      // earlier change in the branch?
      const { trunkVersion } = firstUpdate;
      this.firstInOrder = firstUpdate.branchBaseVersion === trunkVersion;

      /* this.lastContiguousWithTrunk is the version number of the last version
      from the branch that is contiguous with the trunk version. In other words,
      it is the version number of the last version where there has been no
      update from outside the branch between the version and the trunk version.
      this.lastContiguousWithTrunk is not related to branch order: as long as
      there hasn't been an update from outside the branch, the branch is
      contiguous, regardless of the order of the updates within it. */
      this.lastContiguousWithTrunk = firstUpdate.version === trunkVersion + 1
        ? firstUpdate.version
        : 0;
    } else {
      // If the entity was both created and updated offline before being sent to
      // the server, then we treat the creation as part of the same branch as
      // the update(s). The creation doesn't have a branch ID, but we treat it
      // as part of the branch anyway.
      this.first = entityRoot;
      // If the submission for the entity creation was received late and
      // processed out of order, then firstUpdate.version === 1. In that case,
      // we can't reliably determine which entity version corresponds to the
      // entity creation, so we don't treat the creation as part of the branch.
      this.length = firstUpdate.version === 1 ? 1 : 2;
      this.firstInOrder = this.length === 2;
      this.lastContiguousWithTrunk = firstUpdate.version === 2 ? 2 : 1;
    }

    this.id = firstUpdate.branchId;
    // The last version from the branch to be processed
    this.last = firstUpdate;
  }

  add(version) {
    this.length += 1;
    this.last = version;
    if (version.baseVersion === this.lastContiguousWithTrunk &&
      version.version === version.baseVersion + 1)
      this.lastContiguousWithTrunk = version.version;
  }
}

export default () => {
  const { createResource } = useRequestData();
  return createResource('entityVersions', () => ({
    transformResponse: ({ data: versions }) => {
      const branches = new Map();
      for (const version of versions) {
        // Track offline branches.
        const { branchId } = version;
        if (branchId != null && version.branchBaseVersion != null) {
          const existingBranch = branches.get(branchId);
          if (existingBranch == null) {
            const newBranch = new Branch(version, versions[0]);
            branches.set(branchId, newBranch);
            version.branch = newBranch;
            // If the entity was created offline, then add the branch to the
            // entity creation.
            newBranch.first.branch = newBranch;
          } else {
            existingBranch.add(version);
            version.branch = existingBranch;
          }
        }

        // Convert some arrays to sets.
        version.baseDiff = new Set(version.baseDiff);
        version.serverDiff = new Set(version.serverDiff);
        const { conflictingProperties } = version;
        version.conflictingProperties = conflictingProperties != null
          ? new Set(conflictingProperties)
          : new Set();
      }

      // Ignore single-updated "branches."
      for (const branch of branches.values()) {
        if (branch.length === 1 && branch.firstInOrder)
          delete branch.first.branch;
      }

      return versions;
    }
  }));
};
