import * as Actors from './data/actors';
import * as Backups from './data/backups';
import * as FieldKeys from './data/fieldKeys';
import * as FormAttachments from './data/form-attachments';
import * as Forms from './data/forms';
import * as Projects from './data/projects';
import * as Sessions from './data/sessions';
import * as Submissions from './data/submissions';
import * as Users from './data/users';
import { resetDataStores } from './data/data-store';

const testData = Object.assign(
  {},
  Actors,
  Backups,
  FieldKeys,
  FormAttachments,
  Forms,
  Projects,
  Sessions,
  Submissions,
  Users
);

testData.reset = resetDataStores;

export default testData;
