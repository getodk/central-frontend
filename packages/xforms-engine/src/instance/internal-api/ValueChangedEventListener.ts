import type { SimpleAtomicStateSetter } from '../../lib/reactivity/types';
import type { ActionDefinition } from '../../parse/model/ActionDefinition';
import type { AttributeContext } from './AttributeContext';
import type { InstanceValueContext } from './InstanceValueContext';

export interface ValueChangedEventListener {
  context: AttributeContext | InstanceValueContext;
  setRelevantValue: SimpleAtomicStateSetter<string>;
  action: ActionDefinition;
  ref: string;
}
