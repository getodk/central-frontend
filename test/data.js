import * as administrators from './data/administrators';
import * as backups from './data/backups';
import * as fieldKeys from './data/fieldKeys';
import * as forms from './data/forms';
import * as sessions from './data/sessions';
import * as submissions from './data/submissions';
import { resetDataStores } from './data/data-store';

const testData = Object.assign(
  {},
  administrators,
  backups,
  fieldKeys,
  forms,
  sessions,
  submissions
);

testData.reset = resetDataStores;

export default testData;
