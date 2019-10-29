import * as Actors from './actors';
import * as Assignments from './assignments';
import * as Audits from './audits';
import * as Backups from './backups';
import * as FieldKeys from './field-keys';
import * as FormAttachments from './form-attachments';
import * as Forms from './forms';
import * as Keys from './keys';
import * as Projects from './projects';
import * as Roles from './roles';
import * as Sessions from './sessions';
import * as Submissions from './submissions';
import * as Users from './users';
import { resetDataStores } from './data-store';

const testData = Object.assign(
  {},
  Actors,
  Assignments,
  Audits,
  Backups,
  FieldKeys,
  FormAttachments,
  Forms,
  Keys,
  Projects,
  Roles,
  Sessions,
  Submissions,
  Users
);

testData.reset = resetDataStores;

export default testData;
