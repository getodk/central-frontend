import DateTime from '../../../src/components/date-time.vue';
import FieldKeyRow from '../../../src/components/field-key/row.vue';
import TimeAndUser from '../../../src/components/time-and-user.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FieldKeyRow', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
  });

  it('shows the display name', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    testData.extendedFieldKeys.createPast(1, { displayName: 'My App User' });
    return load('/projects/1/app-users').then(app => {
      const text = app.get('.field-key-row .display-name').text();
      text.should.equal('My App User');
    });
  });

  it('renders the Created column correctly', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    const { createdAt } = testData.extendedFieldKeys.createPast(1).last();
    return load('/projects/1/app-users').then(app => {
      const timeAndUser = app.getComponent(FieldKeyRow).getComponent(TimeAndUser);
      const props = timeAndUser.props();
      props.iso.should.equal(createdAt);
      props.user.displayName.should.equal('Alice');
    });
  });

  it('shows lastUsed', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    const now = new Date().toISOString();
    testData.extendedFieldKeys.createPast(1, { lastUsed: now });
    return load('/projects/1/app-users').then(app => {
      const row = app.getComponent(FieldKeyRow);
      row.findAllComponents(DateTime)[1].props().iso.should.equal(now);
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
      const app = await load('/projects/1/app-users', { attachTo: document.body });
      document.querySelectorAll('.popover').length.should.equal(0);
      await app.get('.field-key-row-popover-link').trigger('click');
      document.querySelectorAll('.popover').length.should.equal(1);
    });

    it("shows the app user's display name", async () => {
      const app = await load('/projects/1/app-users', { attachTo: document.body });
      await app.get('.field-key-row-popover-link').trigger('click');
      const text = document.querySelector('.popover p').textContent;
      text.should.containEql('App User 2');
    });

    it('defaults to a managed QR code', async () => {
      const app = await load('/projects/1/app-users', { attachTo: document.body });
      await app.get('.field-key-row-popover-link').trigger('click');
      const panel = document.querySelector('.popover .field-key-qr-panel');
      panel.classList.contains('legacy').should.be.false();
    });

    describe('after user clicks link to switch to a legacy QR code', () => {
      it('shows a legacy QR code', async () => {
        const app = await load('/projects/1/app-users', { attachTo: document.body });
        await app.get('.field-key-row-popover-link').trigger('click');
        document.querySelector('.popover .switch-code').click();
        await app.vm.$nextTick();
        const panel = document.querySelector('.popover .field-key-qr-panel');
        panel.classList.contains('legacy').should.be.true();
      });

      it('focuses the link to switch back to a managed QR code', async () => {
        const app = await load('/projects/1/app-users', { attachTo: document.body });
        await app.get('.field-key-row-popover-link').trigger('click');
        document.querySelector('.popover .switch-code').click();
        await app.vm.$nextTick();
        document.querySelector('.popover .switch-code').should.be.focused();
      });

      it('shows a legacy QR code in the next popover', async () => {
        const app = await load('/projects/1/app-users', { attachTo: document.body });
        const links = app.findAll('.field-key-row-popover-link');
        await links[0].trigger('click');
        document.querySelector('.popover .switch-code').click();
        await app.vm.$nextTick();
        await links[1].trigger('click');
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
      const text = app.getComponent(FieldKeyRow).findAll('td')[3].text();
      text.should.equal('Access revoked');
    });
  });
});
