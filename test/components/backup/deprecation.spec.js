import BackupDeprecation from '../../../src/components/backup/deprecation.vue';

import useBackups from '../../../src/request-data/backups';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockResponse } from '../../util/axios';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options) =>
  mount(BackupDeprecation, mergeMountOptions(options, {
    container: { requestData: testRequestData([useBackups]) }
  }));

describe('BackupDeprecation', () => {
  it('renders if backups are configured', () => {
    testData.standardConfigs.createPast(1, {
      key: 'backups',
      value: { type: 'google' }
    });
    const component = mountComponent({
      container: {
        requestData: { backupsConfig: testData.standardConfigs.forKey('backups') }
      }
    });
    component.find('*').exists().should.be.true();
  });

  it('does not render if backups are not configured', () => {
    const component = mountComponent({
      container: {
        requestData: { backupsConfig: mockResponse.problem(404.1) }
      }
    });
    component.find('*').exists().should.be.false();
  });
});
