import DateTime from '../../../src/components/date-time.vue';
import FieldKeyRow from '../../../src/components/field-key/row.vue';
import FieldKeyDataRow from '../../../src/components/field-key/data-row.vue';

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

  it('shows createdAt', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    const { createdAt } = testData.extendedFieldKeys.createPast(1).last();
    return load('/projects/1/app-users').then(app => {
      const row = app.getComponent(FieldKeyRow);
      row.findAllComponents(DateTime)[0].props().iso.should.equal(createdAt);
    });
  });

  it('shows createdBy', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    testData.extendedFieldKeys.createPast(1);
    return load('/projects/1/app-users').then(app => {
      const row = app.getComponent(FieldKeyRow);
      row.get('.created-by').text().should.equal('Alice');
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

    it('toggles the popover', async () => {
      const app = await load('/projects/1/app-users', { attachTo: document.body });
      await app.get('.field-key-row-popover-link').trigger('click');
      should.exist(document.querySelector('.popover .field-key-qr-panel'));
      await app.get('.field-key-row-popover-link').trigger('click');
      should.not.exist(document.querySelector('.popover'));
    });

    it('hides the popover on close button', async () => {
      const app = await load('/projects/1/app-users', { attachTo: document.body });
      await app.get('.field-key-row-popover-link').trigger('click');
      should.exist(document.querySelector('.popover .field-key-qr-panel'));
      await document.querySelector('.popover button').click();
      should.not.exist(document.querySelector('.popover'));
    });

    it("shows the app user's display name", async () => {
      const app = await load('/projects/1/app-users', { attachTo: document.body });
      await app.get('.field-key-row-popover-link').trigger('click');
      const text = document.querySelector('.popover p').textContent;
      text.should.include('App User 2');
    });

    it('defaults to a managed QR code', async () => {
      const app = await load('/projects/1/app-users', { attachTo: document.body });
      await app.get('.field-key-row-popover-link').trigger('click');
      const panel = document.querySelector('.popover .field-key-qr-panel');
      panel.classList.contains('legacy').should.be.false;
    });

    describe('after user clicks link to switch to a legacy QR code', () => {
      it('shows a legacy QR code', async () => {
        const app = await load('/projects/1/app-users', { attachTo: document.body });
        await app.get('.field-key-row-popover-link').trigger('click');
        document.querySelector('.popover .switch-code').click();
        await app.vm.$nextTick();
        const panel = document.querySelector('.popover .field-key-qr-panel');
        panel.classList.contains('legacy').should.be.true;
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
        text.should.include('App User 1');
        panel.classList.contains('legacy').should.be.true;
      });
    });
  });

  it('indicates if access is revoked', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    testData.extendedFieldKeys.createPast(1, { token: null });
    return load('/projects/1/app-users').then(app => {
      const text = app.getComponent(FieldKeyRow).findAll('td')[1].text();
      text.should.equal('Access revoked');
    });
  });

  describe('custom properties', () => {
    it('shows a column header for each actor property', () => {
      testData.extendedProjects.createPast(1, { appUsers: 1 });
      testData.extendedFieldKeys.createPast(1);
      testData.actorProperties.createPast(1, { name: 'region' });
      testData.actorProperties.createPast(1, { name: 'department' });
      return load('/projects/1/app-users').then(app => {
        const headers = app.findAll('#field-key-list-table th');
        const headerTexts = headers.map(h => h.text());
        headerTexts.should.include('region');
        headerTexts.should.include('department');
      });
    });

    it('shows property values for a field key', () => {
      testData.extendedProjects.createPast(1, { appUsers: 1 });
      testData.extendedFieldKeys.createPast(1, {
        properties: {
          region: 'North',
          department: 'Health'
        }
      });
      testData.actorProperties.createPast(1, { name: 'region' });
      testData.actorProperties.createPast(1, { name: 'department' });
      return load('/projects/1/app-users').then(app => {
        const row = app.getComponent(FieldKeyDataRow);
        const propertyCells = row.findAll('td');
        propertyCells.length.should.equal(2);
        propertyCells[0].text().should.equal('North');
        propertyCells[1].text().should.equal('Health');
      });
    });

    it('shows empty value when property is not set', () => {
      testData.extendedProjects.createPast(1, { appUsers: 1 });
      testData.extendedFieldKeys.createPast(1, { properties: {} });
      testData.actorProperties.createPast(1, { name: 'region' });
      return load('/projects/1/app-users').then(app => {
        const row = app.getComponent(FieldKeyDataRow);
        const propertyCells = row.findAll('td');
        propertyCells.length.should.equal(1);
        propertyCells[0].text().should.equal('');
      });
    });
  });
});
