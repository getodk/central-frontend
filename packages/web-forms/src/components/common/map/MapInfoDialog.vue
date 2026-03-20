<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import Dialog from 'primevue/dialog';

defineProps<{
	actionsInfo: Array<{
		readonly icon: string;
		readonly description: string;
		infoClasses?: string[];
	}>;
	visible: boolean;
}>();

const emit = defineEmits(['update:visible']);
</script>

<template>
	<Dialog
		:visible="visible"
		modal
		class="map-info-dialog"
		:draggable="false"
		@update:visible="emit('update:visible', $event)"
	>
		<template #header>
			<!-- TODO: translations -->
			<strong>How to use the map?</strong>
		</template>

		<template #default>
			<ul class="odk-form-list">
				<li v-for="(action, index) in actionsInfo" :key="index" class="odk-form-list-item" :class="action.infoClasses?.join(' ')">
					<div class="map-action-description">
						<IconSVG :name="action.icon" />
						<span>{{ action.description }}</span>
					</div>
				</li>
			</ul>
		</template>
	</Dialog>
</template>

<style scoped lang="scss">
.odk-form-list {
	.odk-form-list-item:first-child {
		padding-top: 0;
	}

	.map-action-description {
		display: flex;
		align-items: center;
		gap: var(--odk-spacing-xl);
	}
}
</style>
