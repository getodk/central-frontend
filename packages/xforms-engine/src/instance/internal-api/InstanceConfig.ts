import type { InstanceAttachmentFileNameFactory } from '../../client/attachments/InstanceAttachmentsConfig.ts';
import type {
  FormInstanceConfig,
  GeolocationProvider,
  InstanceDefaults,
  PreloadProperties,
} from '../../client/form/FormInstanceConfig.ts';
import type { OpaqueReactiveObjectFactory } from '../../client/OpaqueReactiveObjectFactory.ts';

export interface InstanceConfig {
  /**
   * @see {@link FormInstanceConfig.stateFactory}
   */
  readonly clientStateFactory: OpaqueReactiveObjectFactory;

  readonly computeAttachmentName: InstanceAttachmentFileNameFactory;

  readonly preloadProperties: PreloadProperties;

  readonly instanceDefaults: InstanceDefaults;

  readonly geolocationProvider: GeolocationProvider | undefined;
}
