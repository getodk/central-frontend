import AnalyticsForm from '../../../src/components/analytics/form.vue';

import testData from '../../data';
import { mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountOptions = () => {
  const config = testData.standardConfigs.forKey('analytics');
  return {
    requestData: {
      analyticsConfig: config != null ? config : { problem: 404.1 }
    }
  };
};

describe('AnalyticsForm', () => {
  beforeEach(() => {
    mockLogin({ email: 'alice@getodk.org' });
  });

  describe('analytics are not configured', () => {
    it('selects the correct radio', () => {
      const form = mount(AnalyticsForm, mountOptions());
      form.get('input[type="radio"]').element.checked.should.be.true();
    });

    it('renders the contact fields correctly', () => {
      const form = mount(AnalyticsForm, mountOptions());
      form.get('fieldset').element.disabled.should.be.true();
      form.get('input[type="checkbox"]').element.checked.should.be.false();
      form.get('fieldset fieldset').element.disabled.should.be.true();
      form.get('input[type="email"]').element.value.should.equal('alice@getodk.org');
      form.get('input[autocomplete="organization"]').element.value.should.equal('');
    });
  });

  describe('analytics are disabled', () => {
    beforeEach(() => {
      testData.standardConfigs.createPast(1, {
        key: 'analytics',
        value: { enabled: false }
      });
    });

    it('selects the correct radio', () => {
      const form = mount(AnalyticsForm, mountOptions());
      form.findAll('input[type="radio"]').at(1).element.checked.should.be.true();
    });

    it('renders the contact fields correctly', () => {
      const form = mount(AnalyticsForm, mountOptions());
      form.get('fieldset').element.disabled.should.be.true();
      form.get('input[type="checkbox"]').element.checked.should.be.false();
      form.get('fieldset fieldset').element.disabled.should.be.true();
      form.get('input[type="email"]').element.value.should.equal('alice@getodk.org');
      form.get('input[autocomplete="organization"]').element.value.should.equal('');
    });
  });

  describe('analytics are enabled', () => {
    it('selects the correct radio', () => {
      testData.standardConfigs.createPast(1, {
        key: 'analytics',
        value: { enabled: true }
      });
      const form = mount(AnalyticsForm, mountOptions());
      form.findAll('input[type="radio"]').at(2).element.checked.should.be.true();
    });

    it('renders contact fields correctly if no contact information was provided', () => {
      testData.standardConfigs.createPast(1, {
        key: 'analytics',
        value: { enabled: true }
      });
      const form = mount(AnalyticsForm, mountOptions());
      form.get('fieldset').element.disabled.should.be.false();
      form.get('input[type="checkbox"]').element.checked.should.be.false();
      form.get('fieldset fieldset').element.disabled.should.be.true();
      form.get('input[type="email"]').element.value.should.equal('alice@getodk.org');
      form.get('input[autocomplete="organization"]').element.value.should.equal('');
    });

    it('renders contact fields correctly if a work email address was provided', () => {
      testData.standardConfigs.createPast(1, {
        key: 'analytics',
        value: { enabled: true, email: 'bob@getodk.org' }
      });
      const form = mount(AnalyticsForm, mountOptions());
      form.get('fieldset').element.disabled.should.be.false();
      form.get('input[type="checkbox"]').element.checked.should.be.true();
      form.get('fieldset fieldset').element.disabled.should.be.false();
      form.get('input[type="email"]').element.value.should.equal('bob@getodk.org');
      form.get('input[autocomplete="organization"]').element.value.should.equal('');
    });

    it('renders contact fields correctly if organization was provided', () => {
      testData.standardConfigs.createPast(1, {
        key: 'analytics',
        value: { enabled: true, organization: 'ODK' }
      });
      const form = mount(AnalyticsForm, mountOptions());
      form.get('fieldset').element.disabled.should.be.false();
      form.get('input[type="checkbox"]').element.checked.should.be.true();
      form.get('fieldset fieldset').element.disabled.should.be.false();
      form.get('input[type="email"]').element.value.should.equal('alice@getodk.org');
      form.get('input[autocomplete="organization"]').element.value.should.equal('ODK');
    });
  });

  it('enables the checkbox once share is selected', async () => {
    const form = mount(AnalyticsForm, mountOptions());
    await form.findAll('input[type="radio"]').at(2).setChecked();
    form.get('fieldset').element.disabled.should.be.false();
  });

  it('enables the contact form once the checkbox is checked', async () => {
    testData.standardConfigs.createPast(1, {
      key: 'analytics',
      value: { enabled: true }
    });
    const form = mount(AnalyticsForm, mountOptions());
    await form.get('input[type="checkbox"]').setChecked();
    form.get('fieldset fieldset').element.disabled.should.be.false();
  });

  describe('request to unset the configuration', () => {
    beforeEach(() => {
      testData.standardConfigs.createPast(1, {
        key: 'analytics',
        value: { enabled: true }
      });
    });

    it('sends the correct request', () =>
      mockHttp()
        .mount(AnalyticsForm, mountOptions())
        .request(async (form) => {
          await form.get('input[type="radio"]').setChecked();
          return form.trigger('submit');
        })
        .respondWithSuccess()
        .testRequests([{ method: 'DELETE', url: '/v1/config/analytics' }]));

    it('sets analyticsConfig after the response', () =>
      mockHttp()
        .mount(AnalyticsForm, mountOptions())
        .request(async (form) => {
          await form.get('input[type="radio"]').setChecked();
          return form.trigger('submit');
        })
        .respondWithSuccess()
        .afterResponse(form => {
          const { analyticsConfig } = form.vm.$store.state.request.data;
          analyticsConfig.isEmpty().should.be.true();
        }));
  });

  describe('request to disable analytics', () => {
    it('sends the correct request', () =>
      mockHttp()
        .mount(AnalyticsForm, mountOptions())
        .request(async (form) => {
          await form.findAll('input[type="radio"]').at(1).setChecked();
          return form.trigger('submit');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'POST',
          url: '/v1/config/analytics',
          data: { enabled: false }
        }]));

    it('does not send contact information', () =>
      mockHttp()
        .mount(AnalyticsForm, mountOptions())
        .request(async (form) => {
          await form.findAll('input[type="radio"]').at(2).setChecked();
          await form.get('input[type="checkbox"]').setChecked();
          await form.get('input[type="email"]').setValue('bob@getodk.org');
          await form.get('input[autocomplete="organization"]').setValue('ODK');
          await form.findAll('input[type="radio"]').at(1).setChecked();
          return form.trigger('submit');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'POST',
          url: '/v1/config/analytics',
          data: { enabled: false }
        }]));

    it('sets analyticsConfig after the response', () =>
      mockHttp()
        .mount(AnalyticsForm, mountOptions())
        .request(async (form) => {
          await form.findAll('input[type="radio"]').at(1).setChecked();
          return form.trigger('submit');
        })
        .respondWithData(() => testData.standardConfigs.createNew({
          key: 'analytics',
          value: { enabled: false }
        }))
        .afterResponse(form => {
          const { analyticsConfig } = form.vm.$store.state.request.data;
          analyticsConfig.get().enabled.should.be.false();
        }));
  });

  describe('request to enable analytics', () => {
    it('sends the correct request', () =>
      mockHttp()
        .mount(AnalyticsForm, mountOptions())
        .request(async (form) => {
          await form.findAll('input[type="radio"]').at(2).setChecked();
          return form.trigger('submit');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'POST',
          url: '/v1/config/analytics',
          data: { enabled: true }
        }]));

    it('sends the work email address if it is provided', () =>
      mockHttp()
        .mount(AnalyticsForm, mountOptions())
        .request(async (form) => {
          await form.findAll('input[type="radio"]').at(2).setChecked();
          await form.get('input[type="checkbox"]').setChecked();
          await form.get('input[type="email"]').setValue('bob@getodk.org');
          return form.trigger('submit');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'POST',
          url: '/v1/config/analytics',
          data: { enabled: true, email: 'bob@getodk.org' }
        }]));

    it('sends the organization if it is provided', () =>
      mockHttp()
        .mount(AnalyticsForm, mountOptions())
        .request(async (form) => {
          await form.findAll('input[type="radio"]').at(2).setChecked();
          await form.get('input[type="checkbox"]').setChecked();
          await form.get('input[type="email"]').setValue('');
          await form.get('input[autocomplete="organization"]').setValue('ODK');
          return form.trigger('submit');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'POST',
          url: '/v1/config/analytics',
          data: { enabled: true, organization: 'ODK' }
        }]));

    it('does not send contact information if the checkbox is unchecked', () =>
      mockHttp()
        .mount(AnalyticsForm, mountOptions())
        .request(async (form) => {
          await form.findAll('input[type="radio"]').at(2).setChecked();
          await form.get('input[type="checkbox"]').setChecked();
          await form.get('input[type="email"]').setValue('bob@getodk.org');
          await form.get('input[autocomplete="organization"]').setValue('ODK');
          await form.get('input[type="checkbox"]').setChecked(false);
          return form.trigger('submit');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'POST',
          url: '/v1/config/analytics',
          data: { enabled: true }
        }]));

    it('sets analyticsConfig after the response', () =>
      mockHttp()
        .mount(AnalyticsForm, mountOptions())
        .request(async (form) => {
          await form.findAll('input[type="radio"]').at(2).setChecked();
          return form.trigger('submit');
        })
        .respondWithData(() => testData.standardConfigs.createNew({
          key: 'analytics',
          value: { enabled: true }
        }))
        .afterResponse(form => {
          const { analyticsConfig } = form.vm.$store.state.request.data;
          analyticsConfig.get().enabled.should.be.true();
        }));
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(AnalyticsForm, mountOptions())
      .testStandardButton({
        button: '.btn-primary',
        request: async (form) => {
          await form.findAll('input[type="radio"]').at(2).setChecked();
          return form.trigger('submit');
        }
      }));

  it('shows an alert after a successful response', () =>
    mockHttp()
      .mount(AnalyticsForm, mountOptions())
      .request(async (form) => {
        await form.findAll('input[type="radio"]').at(2).setChecked();
        return form.trigger('submit');
      })
      .respondWithData(() => testData.standardConfigs.createNew({
        key: 'analytics',
        value: { enabled: true }
      }))
      .afterResponse(form => {
        form.should.alert('success');
      }));
});
