import { StaticDocument } from '../../../integration/xpath/static-dom/StaticDocument.ts';
import type { StaticElementOptions } from '../../../integration/xpath/static-dom/StaticElement.ts';
import { assertSecondaryInstanceDefinition } from './assertSecondaryInstanceDefinition.ts';
import type { SecondaryInstanceDefinition } from './SecondaryInstancesDefinition.ts';
import type { SecondaryInstanceSourceFormat } from './sources/SecondaryInstanceSource.ts';

// prettier-ignore
type SecondaryInstanceRoot =
	| StaticElementOptions
	| '';

export const defineSecondaryInstance = (
  instanceId: string,
  secondaryInstanceRoot: SecondaryInstanceRoot,
  sourceFormat: SecondaryInstanceSourceFormat | null = null
): SecondaryInstanceDefinition => {
  const doc = new StaticDocument({
    documentRoot: {
      name: 'instance',
      attributes: [
        {
          name: 'id',
          value: instanceId,
        },
      ],
      children: [secondaryInstanceRoot],
    },
    nodesetPrefix: `instance('${instanceId}')`,
    sourceFormat,
  });

  assertSecondaryInstanceDefinition(doc);

  return doc;
};
