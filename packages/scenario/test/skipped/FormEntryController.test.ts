import { describe } from 'vitest';
import type { Scenario } from '../../src/jr/Scenario.ts';

/**
 * **PORTING NOTES**
 *
 * Currently, we have no notion, **in the engine**, of a controller in the sense
 * under test here. It's worth noting that the tested logic likely has overlap
 * with the logic we've ported to support {@link Scenario}'s navigation APIs.
 * It's also worth noting that much of that logic will likely be applicable to
 * _other clients_ (e.g. `ui-vue`). It seems possible, but unlikely, that we'd
 * want navigational logic in the engine, given its approach to state is meant
 * to be highly flexible for client presentation. We may consider if/how much we
 * want to extract the similar logic into some other shared package or otherwise
 * make it available across clients.
 */
describe.skip('FormEntryControllerTest.java');
