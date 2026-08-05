import { JRResourceService } from '../fixtures/JRResourceService';
import { afterEach, beforeEach } from 'vitest';

let state: SharedJRResourceService | null = null;

export class SharedJRResourceService extends JRResourceService {
  static init(): SharedJRResourceService {
    state ??= new this();
    return state;
  }

  private constructor() {
    super();

    beforeEach(() => {
      this.reset();
    });

    afterEach(() => {
      this.reset();
    });
  }
}
