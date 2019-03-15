/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { DateTime } from 'luxon';

/* RECENT_DURATION is the duration for which a backup attempt is considered
"recent": if the server returns no audit log entry of a recent backup attempt,
that means that there has been no backup attempt for that duration into the
past. If the server returns no recent backup attempt, and if backups were
configured more than that duration into the past (that is, if the current
backups config is itself not recent), then something may have gone wrong. */
const RECENT_DURATION = { days: 3 };

// This class does not extend the base presenter class.
export default class BackupsConfig {
  constructor(data = {}) {
    this._setAt = data.setAt;
    this._recent = data.recent != null
      ? this.constructor.recentForConfig(data)
      : null;
  }

  // recentForConfig() returns the recent backup attempts for the current
  // config.
  static recentForConfig({ setAt, recent }) {
    const result = [];
    for (const attempt of recent) {
      if (attempt.loggedAt < setAt) {
        // Any attempts that follow are for a previous config.
        break;
      }

      /* This will evaluate to `false` only if an attempt for a previous config
      was logged after the current config was created, which seems unlikely. A
      failed attempt might not have a configSetAt property, which means that if
      a failed attempt was logged after the current config was created, we might
      not be able to determine whether the attempt corresponds to the current
      config or (again unlikely) to a previous one. We assume that an attempt
      without a configSetAt property corresponds to the current config. */
      if (attempt.details.configSetAt === setAt ||
        attempt.details.configSetAt == null)
        result.push(attempt);
    }
    return result;
  }

  static notConfigured() { return new BackupsConfig(); }

  static fromResponse(response) {
    return response.status !== 404
      ? new BackupsConfig(response.data)
      : BackupsConfig.notConfigured();
  }

  static recentDateTime() {
    return DateTime.local().minus(RECENT_DURATION);
  }

  get setAt() { return this._setAt; }
  get recent() { return this._recent; }

  get status() {
    if (this._setAt == null) return 'notConfigured';
    if (this._recent.length === 0) {
      return DateTime.fromISO(this._setAt) < this.constructor.recentDateTime()
        ? 'somethingWentWrong'
        : 'neverRun';
    }
    return this._recent[0].details.success ? 'success' : 'somethingWentWrong';
  }
}
