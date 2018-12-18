import * as Administrators from './data/administrators';
import * as Backups from './data/backups';
import * as FieldKeys from './data/fieldKeys';
import * as FormAttachments from './data/form-attachments';
import * as Forms from './data/forms';
import * as Projects from './data/projects';
import * as Sessions from './data/sessions';
import * as Submissions from './data/submissions';
import { resetDataStores } from './data/data-store';

const testData = Object.assign(
  {},
  Administrators,
  Backups,
  FieldKeys,
  FormAttachments,
  Forms,
  Projects,
  Sessions,
  Submissions
);

testData.reset = resetDataStores;

export default testData;
