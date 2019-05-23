import App from '../../../src/components/app.vue';
import BackupList from '../../../src/components/backup/list.vue';
import BackupNew from '../../../src/components/backup/new.vue';
import faker from '../../faker';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { submitForm, trigger } from '../../event';

const clickCreateButton = (wrapper) =>
  trigger.click(wrapper.first('#backup-list-new-button')).then(() => wrapper);
const moveToStep1 = (component) => {
  if (![App, BackupList, BackupNew].includes(component))
    throw new Error('invalid component');
  if (component === BackupNew) return mockHttp().mount(BackupNew);
  const promise = component === App
    ? mockRoute('/system/backups', { attachToDocument: true })
    : mockHttp().mount(BackupList);
  return promise
    .respondWithProblem(404.1)
    .afterResponse(clickCreateButton);
};
// For step 1, fills the form and clicks the Next button.
const next1 = (wrapper) =>
  submitForm(wrapper, '#backup-new form', [['input', '']]);
// For step 2, clicks the Next button.
const next2 = (wrapper) =>
  trigger.click(wrapper.first('#backup-new .btn-primary'))
    .then(() => wrapper);
const moveToStep3 = (component) => moveToStep1(component)
  .request(next1)
  .respondWithData(() => ({
    url: 'http://localhost',
    token: faker.central.token()
  }))
  .afterResponse(next2);
// For step 3, fills the form and clicks the Next button.
const next3 = (wrapper) => submitForm(wrapper, '#backup-new form', [
  ['input', faker.random.alphaNumeric(57)]
]);
const completeSetup = (component) => {
  if (component !== App && component !== BackupList)
    throw new Error('invalid component');
  return moveToStep3(component)
    .request(next3)
    .respondWithSuccess()
    .respondWithData(() => testData.backups.createPast(1).last());
};

describe('BackupNew', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('is initially hidden', () =>
      mockHttp()
        .mount(BackupList)
        .respondWithProblem(404.1)
        .afterResponse(page => {
          page.first(BackupNew).getProp('state').should.be.false();
        }));

    it('opens after button click', () =>
      mockHttp()
        .mount(BackupList)
        .respondWithProblem(404.1)
        .afterResponse(clickCreateButton)
        .then(page => {
          page.first(BackupNew).getProp('state').should.be.true();
        }));
  });

  describe('step 1', () => {
    it('field is focused', () =>
      moveToStep1(App)
        .then(app => app.first('#backup-new input').should.be.focused()));

    it('standard button thinking things', () =>
      moveToStep1(BackupNew)
        .request(next1)
        .standardButton());
  });

  describe('step 3', () => {
    it('field is focused', () =>
      moveToStep3(App)
        .then(app => app.first('#backup-new input').should.be.focused()));

    it('standard button thinking things', () =>
      moveToStep3(BackupNew)
        .request(next3)
        .standardButton());
  });

  describe('after successful setup', () => {
    it('modal is hidden', () =>
      completeSetup(BackupList).then(page => {
        page.first(BackupNew).getProp('state').should.be.false();
      }));

    it('backup status is updated', () =>
      completeSetup(BackupList).then(page => {
        const { backupsConfig } = page.vm.$store.state.request.data;
        backupsConfig.status.should.not.equal('notConfigured');
      }));

    it('success message is shown', () =>
      completeSetup(App).then(app => app.should.alert('success')));
  });
});
