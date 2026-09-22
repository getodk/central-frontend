import { nextTick } from 'vue';

import FieldKeyNew from '../../../src/components/field-key/new.vue';
import FieldKeyQrPanel from '../../../src/components/field-key/qr-panel.vue';

import testData from '../../data';
import { addActorProperty } from '../../util/trigger';
import { load, mockHttp } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { testRequestData } from '../../util/request-data';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  props: { state: true, managed: true },
  container: {
    requestData: testRequestData(['actorProperties'], {
      project: testData.extendedProjects.last(),
      actorProperties: testData.actorProperties.sorted()
    }),
    router: mockRouter('/')
  }
});

describe('FieldKeyNew', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    testData.extendedFieldKeys.createPast(1);
    return load('/projects/1/app-users').testModalToggles({
      modal: FieldKeyNew,
      show: '#field-key-list-create-button',
      hide: '.btn-link'
    });
  });

  it('focuses the input', async () => {
    testData.extendedProjects.createPast(1);
    const modal = mount(FieldKeyNew, mountOptions({ attachTo: document.body }));
    await nextTick();
    modal.get('input').should.be.focused();
  });

  it('implements some standard button things', () => {
    testData.extendedProjects.createPast(1);
    return mockHttp()
      .mount(FieldKeyNew, mountOptions())
      .testStandardButton({
        button: '.btn-primary',
        request: async (modal) => {
          await modal.get('input').setValue('My Field Key');
          return modal.get('form').trigger('submit');
        },
        disabled: ['fieldset', '.btn-link'],
        modal: true
      });
  });

  it('sends the correct request with custom properties', () => {
    testData.extendedProjects.createPast(1);
    testData.actorProperties.createPast(1, { name: 'prop1' });
    return mockHttp()
      .mount(FieldKeyNew, mountOptions())
      .request(async (modal) => {
        await modal.get('input').setValue('My App User');
        await modal.get('textarea').setValue('value1');
        return modal.get('form').trigger('submit');
      })
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('POST');
        url.should.equal('/v1/projects/1/app-users');
        data.should.eql({ displayName: 'My App User', properties: { prop1: 'value1' } });
      })
      .respondWithProblem();
  });

  it('does not send properties when no property values are filled in', () => {
    testData.extendedProjects.createPast(1);
    testData.actorProperties.createPast(1, { name: 'prop1' });
    return mockHttp()
      .mount(FieldKeyNew, mountOptions())
      .request(async (modal) => {
        await modal.get('input').setValue('My App User');
        return modal.get('form').trigger('submit');
      })
      .beforeEachResponse((_, { data }) => {
        data.should.not.have.property('properties');
      })
      .respondWithProblem();
  });

  it('resets the form after the modal is hidden', async () => {
    testData.extendedProjects.createPast(1);
    const modal = mount(FieldKeyNew, mountOptions());
    await modal.get('input').setValue('My App User');
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    modal.get('input').element.value.should.equal('');
  });

  it('resets property values after the modal is hidden', async () => {
    testData.extendedProjects.createPast(1);
    testData.actorProperties.createPast(1, { name: 'prop1' });
    const modal = mount(FieldKeyNew, mountOptions());
    await modal.get('textarea').setValue('some value');
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    modal.get('textarea').element.value.should.equal('');
  });

  it('resets property values after Create another is clicked', () => {
    testData.extendedProjects.createPast(1);
    testData.actorProperties.createPast(1, { name: 'prop1' });
    return mockHttp()
      .mount(FieldKeyNew, mountOptions())
      .request(async (modal) => {
        await modal.get('input').setValue('My App User');
        await modal.get('textarea').setValue('some value');
        return modal.get('form').trigger('submit');
      })
      .respondWithData(() => testData.standardFieldKeys.createNew({ displayName: 'My App User' }))
      .afterResponse(async (modal) => {
        await modal.get('.btn-link').trigger('click');
        modal.get('textarea').element.value.should.equal('');
      });
  });

  describe('adding a property inline', () => {
    it('sends the correct requests', () => {
      testData.extendedProjects.createPast(1);
      return mockHttp()
        .mount(FieldKeyNew, mountOptions())
        .request(async (modal) => {
          await modal.get('input').setValue('My App User');
          await addActorProperty(modal, 'region', 'north');
          return modal.get('form').trigger('submit');
        })
        .respondWithSuccess()
        .respondWithProblem()
        .testRequests([
          {
            method: 'POST',
            url: '/v1/projects/1/actor-properties',
            data: { name: 'region' }
          },
          {
            method: 'POST',
            url: '/v1/projects/1/app-users',
            data: { displayName: 'My App User', properties: { region: 'north' } }
          }
        ]);
    });
  });

  describe('after a successful response', () => {
    beforeEach(() => {
      testData.extendedProjects.createPast(1, { appUsers: 1 });
      testData.extendedFieldKeys.createPast(1);
    });

    const create = (series) => series
      .request(async (app) => {
        await app.get('.heading-with-button button').trigger('click');
        const modal = app.get('#field-key-new');
        await modal.get('input').setValue('input', 'My App User');
        return modal.get('form').trigger('submit');
      })
      .respondWithData(() => testData.standardFieldKeys.createNew({
        displayName: 'My App User'
      }));

    it("shows the app user's display name", () =>
      load('/projects/1/app-users')
        .complete()
        .modify(create)
        .afterResponses(app => {
          const p = app.get('#field-key-new .modal-introduction p');
          p.text().should.include('My App User');
        }));

    describe('QR code', () => {
      it('renders a FieldKeyQrPanel component for the app user', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .afterResponses(app => {
            const panel = app.getComponent(FieldKeyNew).getComponent(FieldKeyQrPanel);
            const { id } = testData.extendedFieldKeys.last();
            panel.props().fieldKey.id.should.equal(id);
          }));

      it('defaults to a managed QR code', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .afterResponses(app => {
            const panel = app.getComponent(FieldKeyNew).getComponent(FieldKeyQrPanel);
            panel.props().managed.should.be.true;
          }));

      describe('after user clicks link to switch to a legacy QR code', () => {
        it('shows a legacy QR code in the modal', () =>
          load('/projects/1/app-users', { attachTo: document.body })
            .complete()
            .modify(create)
            .afterResponses(async (app) => {
              const panel = app.getComponent(FieldKeyNew).getComponent(FieldKeyQrPanel);
              await panel.get('.switch-code').trigger('click');
              panel.props().managed.should.be.false;
            }));

        it('shows a legacy QR code in the next popover', () =>
          load('/projects/1/app-users', { attachTo: document.body })
            .complete()
            .modify(create)
            .complete()
            .request(async (app) => {
              await app.get('#field-key-new .switch-code').trigger('click');
              await app.get('#field-key-new .btn-primary').trigger('click');
            })
            .respondWithData(() => testData.extendedFieldKeys.sorted())
            .afterResponse(async (app) => {
              await app.get('.field-key-row-popover-link').trigger('click');
              await app.vm.$nextTick();
              const panel = document.querySelector('.popover .field-key-qr-panel');
              panel.classList.contains('legacy').should.be.true;
            }));

        it('allows the user to switch back to a managed QR code', () =>
          load('/projects/1/app-users', { attachTo: document.body })
            .complete()
            .modify(create)
            .afterResponses(async (app) => {
              const panel = app.getComponent(FieldKeyNew).getComponent(FieldKeyQrPanel);
              await panel.get('.switch-code').trigger('click');
              await panel.get('.switch-code').trigger('click');
              panel.props().managed.should.be.true;
            }));
      });

      it('shows a legacy QR code in modal after user switches in popover', () =>
        load('/projects/1/app-users', { attachTo: document.body })
          .afterResponses(async (app) => {
            await app.get('.field-key-row-popover-link').trigger('click');
            await app.vm.$nextTick();
            document.querySelector('.popover .switch-code').click();
          })
          .modify(create)
          .afterResponses(app => {
            const panel = app.getComponent(FieldKeyNew).getComponent(FieldKeyQrPanel);
            panel.props().managed.should.be.false;
          }));
    });

    describe('after the Done button is clicked', () => {
      it('hides the modal', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(app => app.get('#field-key-new .btn-primary').trigger('click'))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.getComponent(FieldKeyNew).props().state.should.be.false;
          }));

      it('updates the number of rows in the table', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(app => app.get('#field-key-new .btn-primary').trigger('click'))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.findAll('#field-key-list-table tbody tr').length.should.equal(2);
          }));

      it('shows a success alert', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(app => app.get('#field-key-new .btn-primary').trigger('click'))
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.should.alert('success');
          }));
    });

    describe('after the "Create another" button is clicked', () => {
      it('does not hide the modal', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .afterResponses(async (app) => {
            await app.get('#field-key-new .btn-link').trigger('click');
            app.getComponent(FieldKeyNew).props().state.should.be.true;
          }));

      it('shows a blank input', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .afterResponses(async (app) => {
            await app.get('#field-key-new .btn-link').trigger('click');
            app.get('#field-key-new input').element.value.should.equal('');
          }));

      it('focuses the input', () =>
        load('/projects/1/app-users', { attachTo: document.body })
          .complete()
          .modify(create)
          .afterResponses(async (app) => {
            await app.get('#field-key-new .btn-link').trigger('click');
            app.get('#field-key-new input').should.be.focused();
          }));
    });

    describe('after "Create another" button, then Cancel button are clicked', () => {
      it('hides the modal', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(async (app) => {
            await app.get('#field-key-new .btn-link').trigger('click');
            return app.get('#field-key-new .btn-link').trigger('click');
          })
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.getComponent(FieldKeyNew).props().state.should.be.false;
          }));

      it('updates the number of rows in the table', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(async (app) => {
            await app.get('#field-key-new .btn-link').trigger('click');
            return app.get('#field-key-new .btn-link').trigger('click');
          })
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.findAll('#field-key-list-table tbody tr').length.should.equal(2);
          }));

      it('shows a success alert', () =>
        load('/projects/1/app-users')
          .complete()
          .modify(create)
          .complete()
          .request(async (app) => {
            await app.get('#field-key-new .btn-link').trigger('click');
            return app.get('#field-key-new .btn-link').trigger('click');
          })
          .respondWithData(() => testData.extendedFieldKeys.sorted())
          .afterResponse(app => {
            app.should.alert('success');
          }));
    });

    it('fetches app users after link to Form Access tab is clicked', () =>
      load('/projects/1/app-users')
        .complete()
        .modify(create)
        .complete()
        .request(app => {
          const a = app.get('#field-key-new a[href$="/projects/1/form-access"]');
          return a.trigger('click');
        })
        .beforeEachResponse((_, { url }, index) => {
          if (index === 1) url.should.equal('/v1/projects/1/app-users');
        })
        .respondFor('/projects/1/form-access', { project: false }));
  });

  describe('property filters', () => {
    it('resets the property filter after creating a new app user', () => {
      testData.extendedProjects.createPast(1, { appUsers: 2 });
      testData.extendedFieldKeys
        .createPast(1, { displayName: 'App User 1', properties: { region: 'North' } })
        .createPast(1, { displayName: 'App User 2', properties: { region: 'South' } });
      testData.actorProperties.createPast(1, { name: 'region' });
      return load('/projects/1/app-users')
        .complete()
        .request(async (app) => {
          await app.get('.custom-props-filter .dropdown-trigger').trigger('click');
          await app.get('.property-select').setValue('region');
          await app.get('.value-select').setValue('North');
          await app.get('.apply-btn').trigger('click');
          await app.get('#field-key-list-create-button').trigger('click');
          await app.get('#field-key-new input').setValue('App User 3');
          return app.get('#field-key-new form').trigger('submit');
        })
        .respondWithData(() => testData.standardFieldKeys.createNew({ displayName: 'App User 3' }))
        .complete()
        .request(app => app.get('#field-key-new .btn-primary').trigger('click'))
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .afterResponse(app => {
          app.findAll('.field-key-row').length.should.equal(3);
        });
    });
  });

  describe('list of actor properties', () => {
    const create = () => {
      testData.extendedProjects.createPast(1);
      return load('/projects/1/app-users')
        .complete()
        .request(async (app) => {
          await app.get('.heading-with-button button').trigger('click');
          const modal = app.get('#field-key-new');
          await modal.get('input').setValue('input', 'My App User');
          await addActorProperty(modal, 'region', 'north');
          return modal.get('form').trigger('submit');
        })
        // Property creation
        .respondWithSuccess();
    };

    it('updates the list after the app user is created', () =>
      create()
        .respondWithData(() => testData.standardFieldKeys.createNew({
          displayName: 'My App User',
          properties: { region: 'north' }
        }))
        .afterResponses(app => {
          // The table behind the modal should not change until the modal is
          // hidden.
          app.find('.table-freeze-scrolling').exists().should.be.false;
        })
        .request(app => app.get('#field-key-new .btn-primary').trigger('click'))
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .afterResponse(app => {
          app.get('.table-freeze-scrolling th').text().should.equal('region');
        }));

    it('updates the list if only the property request succeeds', () =>
      create()
        .respondWithProblem() // App user creation
        .afterResponses(async (app) => {
          // The table behind the modal should not change until the modal is
          // hidden.
          app.find('.table-freeze-scrolling').exists().should.be.false;
          await app.get('#field-key-new .btn-link').trigger('click');
          app.get('.table-freeze-scrolling th').text().should.equal('region');
        }));

    it('updates the list after multiple app users are created', () =>
      create()
        .respondWithData(() => testData.standardFieldKeys.createNew({
          displayName: 'My App User',
          properties: { region: 'north' }
        }))
        .complete()
        // Create a second actor property and a second app user. There should
        // only be a request for the new property, not the previous one.
        .request(async (app) => {
          const modal = app.get('#field-key-new');
          await modal.get('.btn-link').trigger('click');
          await modal.get('input').setValue('Another App User');
          await modal.get('textarea').setValue('south');
          await addActorProperty(modal, 'prop2', 'value2');
          return modal.get('form').trigger('submit');
        })
        .respondWithSuccess()
        .respondWithData(() => testData.standardFieldKeys.createNew({
          displayName: 'Another App User',
          properties: { region: 'south', prop2: 'value2' }
        }))
        .testRequests([
          {
            method: 'POST',
            url: '/v1/projects/1/actor-properties',
            data: { name: 'prop2' }
          },
          {
            method: 'POST',
            url: '/v1/projects/1/app-users',
            data: {
              displayName: 'Another App User',
              properties: { region: 'south', prop2: 'value2' }
            }
          }
        ])
        .complete()
        // Create a third app user, but don't create another actor property.
        // There should only be a single request.
        .request(async (app) => {
          const modal = app.get('#field-key-new');
          await modal.get('.btn-link').trigger('click');
          await modal.get('input').setValue('One More App User');
          const textareas = modal.findAll('textarea');
          await textareas[0].setValue('east');
          await textareas[1].setValue('value3');
          return modal.get('form').trigger('submit');
        })
        .respondWithData(() => testData.standardFieldKeys.createNew({
          displayName: 'One More App User',
          properties: { region: 'east', prop2: 'value3' }
        }))
        .testRequests([
          {
            method: 'POST',
            url: '/v1/projects/1/app-users',
            data: {
              displayName: 'One More App User',
              properties: { region: 'east', prop2: 'value3' }
            }
          }
        ])
        .afterResponses(app => {
          // The table behind the modal should not change until the modal is
          // hidden.
          app.find('.table-freeze-scrolling').exists().should.be.false;
        })
        .request(app => app.get('#field-key-new .btn-primary').trigger('click'))
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .afterResponse(app => {
          const text = app.findAll('.table-freeze-scrolling th')
            .map(th => th.text());
          text.should.eql(['region', 'prop2']);
        }));
  });
});
