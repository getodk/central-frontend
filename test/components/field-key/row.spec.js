import DateTime from '../../../src/components/date-time.vue';
import FieldKeyRow from '../../../src/components/field-key/row.vue';
import TimeAndUser from '../../../src/components/time-and-user.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

describe('FieldKeyRow', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
  });

  it('shows the display name', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    testData.extendedFieldKeys.createPast(1, { displayName: 'My App User' });
    return load('/projects/1/app-users').then(app => {
      const text = app.first(FieldKeyRow).first('td').text().trim();
      text.should.equal('My App User');
    });
  });

  it('renders the Created column correctly', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    const { createdAt } = testData.extendedFieldKeys.createPast(1).last();
    return load('/projects/1/app-users').then(app => {
      const timeAndUser = app.first(FieldKeyRow).first(TimeAndUser);
      timeAndUser.getProp('iso').should.equal(createdAt);
      timeAndUser.getProp('user').displayName.should.equal('Alice');
    });
  });

  it('shows lastUsed', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    const now = new Date().toISOString();
    testData.extendedFieldKeys.createPast(1, { lastUsed: now });
    return load('/projects/1/app-users').then(app => {
      app.first(FieldKeyRow).find(DateTime)[1].getProp('iso').should.equal(now);
    });
  });

  describe('after the user clicks "See code"', () => {
    beforeEach(() => {
      testData.extendedProjects.createPast(1, { appUsers: 2 });
      testData.extendedFieldKeys
        .createPast(1, { displayName: 'App User 1' })
        .createPast(1, { displayName: 'App User 2' });
    });

    it('shows the popover', async () => {
      const app = await load('/projects/1/app-users', { attachToDocument: true }, {});
      document.querySelectorAll('.popover').length.should.equal(0);
      await trigger.click(app, '.field-key-row-popover-link');
      await app.vm.$nextTick();
      document.querySelectorAll('.popover').length.should.equal(1);
    });

    it("shows the app user's display name", async () => {
      const app = await load('/projects/1/app-users', { attachToDocument: true }, {});
      await trigger.click(app, '.field-key-row-popover-link');
      await app.vm.$nextTick();
      const text = document.querySelector('.popover p').textContent;
      text.should.containEql('App User 2');
    });

    it('defaults to a managed code', async () => {
      const app = await load('/projects/1/app-users', { attachToDocument: true }, {});
      await trigger.click(app, '.field-key-row-popover-link');
      await app.vm.$nextTick();
      const panel = document.querySelector('.popover .field-key-qr-panel');
      panel.classList.contains('legacy').should.be.false();
    });

    describe('after user clicks link to switch to a legacy code', () => {
      it('shows a legacy code', async () => {
        const app = await load('/projects/1/app-users', { attachToDocument: true }, {});
        await trigger.click(app, '.field-key-row-popover-link');
        await app.vm.$nextTick();
        document.querySelector('.popover .switch-code').click();
        await app.vm.$nextTick();
        const panel = document.querySelector('.popover .field-key-qr-panel');
        panel.classList.contains('legacy').should.be.true();
      });

      it('focuses the link to switch back to a managed code', async () => {
        const app = await load('/projects/1/app-users', { attachToDocument: true }, {});
        await trigger.click(app, '.field-key-row-popover-link');
        await app.vm.$nextTick();
        document.querySelector('.popover .switch-code').click();
        await app.vm.$nextTick();
        document.querySelector('.popover .switch-code').should.be.focused();
      });

      it('shows a legacy code in the next popover', async () => {
        const app = await load('/projects/1/app-users', { attachToDocument: true }, {});
        await trigger.click(app, '.field-key-row-popover-link');
        await app.vm.$nextTick();
        document.querySelector('.popover .switch-code').click();
        await app.vm.$nextTick();
        await trigger.click(app.find('.field-key-row-popover-link')[1]);
        await app.vm.$nextTick();
        const panel = document.querySelector('.popover .field-key-qr-panel');
        const text = panel.querySelectorAll('p')[1].textContent;
        text.should.containEql('App User 1');
        panel.classList.contains('legacy').should.be.true();
      });
    });
  });

  it('indicates if access is revoked', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    testData.extendedFieldKeys.createPast(1, { token: null });
    return load('/projects/1/app-users').then(app => {
      const text = app.first(FieldKeyRow).find('td')[3].text().trim();
      text.should.equal('Access revoked');
    });
  });
});
