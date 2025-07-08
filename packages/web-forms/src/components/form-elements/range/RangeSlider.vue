<script lang="ts">
import type {
	SliderProps as PrimeSliderProps,
	SliderSlots as PrimeSliderSlots,
} from 'primevue/slider';
import PrimeSlider from 'primevue/slider';
import type {
	ComputedOptions,
	DefineComponent,
	ObjectEmitsOptions,
	ComponentOptionsMixin,
	MethodOptions,
} from 'vue';

interface SliderSingleValueProps extends PrimeSliderProps {
	modelValue?: number | undefined;
	range?: false | undefined;
}

interface SliderDualValueProps extends PrimeSliderProps {
	modelValue?: number[] | undefined;
	range: true;
}

interface SliderSingleValueEmits extends ObjectEmitsOptions {
	'update:modelValue'(value: number): void;
}

interface SliderDualValueEmits extends ObjectEmitsOptions {
	'update:modelValue'(value: number[]): void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const SingleValueSlider: DefineComponent<
	SliderSingleValueProps,
	Record<string, never>,
	Record<string, never>,
	ComputedOptions,
	MethodOptions,
	ComponentOptionsMixin,
	PrimeSliderSlots,
	SliderSingleValueEmits
>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const DualValueSlider: DefineComponent<
	SliderDualValueProps,
	Record<string, never>,
	Record<string, never>,
	ComputedOptions,
	MethodOptions,
	ComponentOptionsMixin,
	PrimeSliderSlots,
	SliderDualValueEmits
>;

/**
 * This type addresses confusion in PrimeVue's base type which is polymorphic
 * over the number of values it accepts. We (probably?) won't support the
 * N-value case, so it's not worth refining further here (although it really
 * should be represented as a 2-value type, with its values represented as a
 * 2-member tuple).
 *
 * This refinement of the base types ensures:
 *
 * - we can use plain `number` values (as is expected for our 1-value usage)
 * - any _other_ changes to the base types will be propagated out to our usage
 *   in any future PrimeVue updates
 */
// prettier-ignore
export type RangeSlider =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| typeof SingleValueSlider
	| typeof DualValueSlider;

export default PrimeSlider as RangeSlider;
</script>
