<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import { ODK_VALUE_PROPERTY } from '@/components/common/map/useMapBlock.ts';
import Button from 'primevue/button';
import { computed } from 'vue';

const props = defineProps<{
	reservedProps: Record<string, string> | undefined;
	orderedExtraProps: Map<string, Array<[key: string, value: string]>>;
	isSavedFeatureSelected: boolean;
	canRemove: boolean;
	canSave: boolean;
}>();

const emit = defineEmits(['close', 'save', 'discard']);
const orderedProps = computed(() => {
	const key = props.reservedProps?.[ODK_VALUE_PROPERTY];
	if (key) {
		return props.orderedExtraProps.get(key) ?? [];
	}

	return [];
});
</script>

<template>
	<div v-if="reservedProps" class="map-properties">
		<div class="map-properties-header">
			<strong>{{ reservedProps.odk_label ?? reservedProps.odk_geometry }}</strong>
			<button class="close-icon" @click="emit('close')">
				<IconSVG name="mdiClose" />
			</button>
		</div>

		<dl class="odk-form-list">
			<div v-for="[key = '', value = ''] in orderedProps" :key="key" class="odk-form-list-item">
				<dt>{{ key }}</dt><dd>{{ value }}</dd>
			</div>
		</dl>

		<div class="map-properties-footer">
			<Button v-if="isSavedFeatureSelected && canRemove" outlined severity="contrast" @click="emit('discard')">
				<span>–</span>
				<!-- TODO: translations -->
				<span>Remove selection</span>
			</Button>
			<Button v-if="!isSavedFeatureSelected && canSave" @click="emit('save')">
				<IconSVG name="mdiCheckboxMarkedCircleOutline" size="sm" variant="inverted" />
				<!-- TODO: translations -->
				<span>Save selected</span>
			</Button>
		</div>
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.map-properties {
	background: var(--odk-base-background-color);
	position: absolute;
	top: var(--odk-spacing-m);
	left: var(--odk-spacing-m);
	padding: var(--odk-spacing-xl);
	border: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);
	display: flex;
	flex-direction: column;
	gap: var(--odk-spacing-m);
	width: 360px;
	max-height: min(370px, 90vh);
	box-shadow: 1px 2px 3px 0 rgba(0, 0, 0, 0.2);
}

.map-properties-header {
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	justify-content: space-between;
	align-items: flex-start;
	gap: var(--odk-spacing-m);
	padding: 0;
	-webkit-user-select: text;
	user-select: text;

	strong {
		font-size: var(--odk-dialog-title-font-size);
	}

	.close-icon {
		cursor: pointer;
		margin-top: -12px;
		padding: var(--odk-spacing-s) 0;
		margin-right: -3px;
	}
}

.odk-form-list {
	flex-grow: 2;

	.odk-form-list-item {
		-webkit-user-select: text;
		user-select: text;

		dt,
		dd {
			display: inline;
			margin: 0;
		}

		dt:after {
			content: ':';
			margin-right: var(--odk-spacing-s);
		}
	}
}

.map-properties-footer :deep(.p-button).p-button-contrast.p-button-outlined {
	background: var(--odk-base-background-color);
	-webkit-tap-highlight-color: transparent;

	&:hover {
		background: var(--odk-muted-background-color);
	}
}

@media screen and (max-width: #{pf.$sm}) {
	.map-properties {
		--odk-map-properties-spacing-md: 8px;
	}

	.map-properties {
		top: unset;
		bottom: 70px;
		left: 0;
		right: 0;
		margin: 0 auto;
		width: calc(100% - (var(--odk-map-properties-spacing-md) * 2));
		max-height: 50%;
	}
}
</style>
