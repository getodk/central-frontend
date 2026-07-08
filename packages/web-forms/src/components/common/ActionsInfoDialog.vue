<script lang="ts">
export interface ActionInfo {
	readonly icon: string;
	readonly description: string;
	infoClasses?: string[];
}
</script>

<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import Dialog from 'primevue/dialog';

defineProps<{
	title: string;
	actionsInfo: ActionInfo[];
	visible: boolean;
}>();

const emit = defineEmits(['update:visible']);
</script>

<template>
	<Dialog
		:visible="visible"
		modal
		class="actions-info-dialog"
		:draggable="false"
		@update:visible="emit('update:visible', $event)"
	>
		<template #header>
			<strong>{{ title }}</strong>
		</template>

		<template #default>
			<ul class="odk-form-list">
				<li v-for="(action, index) in actionsInfo" :key="index" class="odk-form-list-item" :class="action.infoClasses?.join(' ')">
					<div class="action-description">
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

	.action-description {
		display: flex;
		align-items: center;
		gap: var(--odk-spacing-xl);
	}
}
</style>
