import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  bind,
  body,
  head,
  html,
  input,
  mainInstance,
  model,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { JRResourceService } from '../scenario/fixtures/JRResourceService.ts';
import { stringAnswer } from '../scenario/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../scenario/jr/Scenario.ts';

describe('Secondary instance cache', () => {

  let resourceService: JRResourceService;

  beforeEach(() => {
    resourceService = new JRResourceService();
  });

  afterEach(() => {
    resourceService.reset();
  });

  describe('filtering of secondary instance items', { timeout: 60 * 1000 }, async () => {

    const csvAttachmentFileName = 'csv-attachment.csv';
    const csvAttachmentURL = `jr://file/${csvAttachmentFileName}` as const;
    const formDefinition = html(
      head(
        title('External secondary instance'),
        model(
          mainInstance(
            t('data id="external-secondary-instance-xml-csv"',
              t('search'),
              t('name'),
              t('address'),
              t('phone'),
              t('age'),
            )
          ),

          t(`instance id="external-csv" src="${csvAttachmentURL}"`),

          bind('/data/search').type('string'),
          bind('/data/name').type('string').readonly('true()').calculate("instance('external-csv')/root/item[id= /data/search ]/name"),
          bind('/data/address').type('string').readonly('true()').calculate("instance('external-csv')/root/item[id= /data/search ]/address"),
          bind('/data/phone').type('string').readonly('true()').calculate("instance('external-csv')/root/item[id= /data/search ]/phone"),
          bind('/data/age').type('string').readonly('true()').calculate("instance('external-csv')/root/item[id= /data/search ]/age"),
        )
      ),
      body(
        input('/data/search'),
        input('/data/name'),
        input('/data/address'),
        input('/data/phone'),
        input('/data/age'),
      )
    );

    let scenario: Scenario;

    beforeEach(async () => {
      const data = Array(100_000)
        .fill(null)
        .map((_, i) => ([`"someid${i}"`, `"abcname${i}"`, `"abcaddress${i}"`, `"abcphone${i}"`, `"abcage${i}"`]));
      data.push();
      const header = ['"id"', '"name"', '"address"', '"phone"', '"age"'];
      const target = ['"targetid"', '"targetname"', '"targetaddress"', '"targetphone"', '"targetage"']
      data.splice(Math.ceil(data.length / 2), 0, target);
      data.unshift(header);
      
      const csvAttachment = data.map(row => row.join(',')).join('\n');
  
      resourceService.activateResource(
        { url: csvAttachmentURL, fileName: csvAttachmentFileName, mimeType: 'text/csv' },
        csvAttachment
      );
      scenario = await Scenario.init('External secondary instance', formDefinition, {
        resourceService,
      });
    }, 60 * 1000);

    it('searches for items in external instances', async () => {
  
      scenario.answer('/data/search', 'targetid');

      expect(scenario.answerOf('/data/search')).toEqualAnswer(stringAnswer('targetid'));
      expect(scenario.answerOf('/data/name')).toEqualAnswer(stringAnswer('targetname'));
      expect(scenario.answerOf('/data/address')).toEqualAnswer(stringAnswer('targetaddress'));
      expect(scenario.answerOf('/data/phone')).toEqualAnswer(stringAnswer('targetphone'));
      expect(scenario.answerOf('/data/age')).toEqualAnswer(stringAnswer('targetage'));
    });
  });
});
