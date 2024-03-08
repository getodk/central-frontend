import type { XFormDefinition } from '../../XFormDefinition.ts';
import { getRepeatElement } from '../../query.ts';
import type { BodyElementDefinitionArray, BodyElementParentContext } from '../BodyDefinition.ts';
import { RepeatDefinition } from '../RepeatDefinition.ts';
import { BaseGroupDefinition } from './BaseGroupDefinition.ts';

/**
 * TODO: The `RepeatGroupDefinition`/`RepeatDefinition` types are currently
 * expected to always pair, mirroring the corresponding XForm structure, e.g.
 *
 * ```xml
 * <group ref="/root/rep"> <!-- RepeatGroupDefinition -->
 *   <repeat nodeset="/root/rep" /> <!-- RepeatDefinition -->
 * </group>
 * ```
 *
 * This structure has already been a source of one bug (where a recursive walk
 * through a `BodyDefinition`'s descendants failed to reach the children of
 * `RepeatDefinition`s). It seems likely this will continue to be a footgun.
 * After some discussion with @lognaturel, I concluded that the pairing isn't
 * strictly necessary, as this should be considered invalid:
 *
 * ```xml
 * <group ref="/root/rep">
 *   <repeat nodeset="/root/rep" />
 *   <input ref="/root/rep/not-a-repeat-child" />
 * </group>
 * ```
 *
 * It **may** make sense to collapse these types in the future, but I've held
 * off, following another discussion with @lognaturel. There's some potential
 * for group/repeat labeling ambiguity.
 *
 * - The current design accommodates sharing a repeat-containing group's label
 *   across multiple repeat instances, but
 * - The
 *   {@link https://github.com/getodk/xforms-spec/blob/791753a09fabd3d64d8cb95776dc0cef71fa4446/_sections/60-repeats.md?plain=1#L46 | ODK XForms spec suggests}
 *   a repeat's first group might be a better candidate
 *
 * Example of such a structure:
 *
 * ```xml
 * <group ref="/root/foo">
 *   <label>Foo (outer label)</label>
 *   <repeat nodeset="/root/foo">
 *     <group>
 *       <label>Foo (inner label)</label>
 *       <!-- ... -->
 *     </group>
 *   </repeat>
 * </group>
 * ```
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - All this so I could attach a JSDoc comment to something other
// than the actual class...
// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
interface IgnoreMeIAmJustHereForTheJSDoc {}

export class RepeatGroupDefinition extends BaseGroupDefinition<'repeat-group'> {
	static override isCompatible(localName: string, element: Element): boolean {
		return this.getGroupType(localName, element) === 'repeat-group';
	}

	readonly type = 'repeat-group';

	readonly repeat: RepeatDefinition;

	get repeatChildren(): BodyElementDefinitionArray {
		return this.repeat.children;
	}

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		// TODO: this has already been queried at least twice before reaching this
		// point!
		const repeat = getRepeatElement(element);

		// TODO: and as such, this should not happen
		if (repeat == null) {
			throw new Error('Invalid repeat-group');
		}

		super(form, parent, element);

		const repeatDefinition = new RepeatDefinition(form, this, repeat);

		this.repeat = repeatDefinition;
	}
}

export type RepeatGroupDefinitionClass = typeof RepeatGroupDefinition;
