import BackupDeprecation from '../../../src/components/backup/deprecation.vue';

import testData from '../../data';
import { mockResponse } from '../../util/axios';
import { mount } from '../../util/lifecycle';

describe('BackupDeprecation', () => {
  it('renders if backups are configured', () => {
    testData.standardConfigs.createPast(1, {
      key: 'backups',
      value: { type: 'google' }
    });
    const component = mount(BackupDeprecation, {
      container: {
        requestData: { backupsConfig: testData.standardConfigs.forKey('backups') }
      }
    });
    component.find('*').exists().should.be.true();
  });

  it('does not render if backups are not configured', () => {
    const component = mount(BackupDeprecation, {
      container: {
        requestData: { backupsConfig: mockResponse.problem(404.1) }
      }
    });
    component.find('*').exists().should.be.false();
  });
});
