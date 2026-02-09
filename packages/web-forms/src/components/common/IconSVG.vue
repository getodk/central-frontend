<script setup lang="ts">
import { computed } from 'vue';
import {
	mdiAlert,
	mdiAlertCircleOutline,
	mdiArrowCollapse,
	mdiArrowExpand,
	mdiArrowULeftTop,
	mdiCamera,
	mdiCheck,
	mdiCheckboxMarkedCircleOutline,
	mdiCheckCircle,
	mdiChevronDown,
	mdiChevronUp,
	mdiClose,
	mdiCogOutline,
	mdiContentSave,
	mdiCrosshairsGps,
	mdiDotsVertical,
	mdiDownload,
	mdiDragVertical,
	mdiEyeOutline,
	mdiFileOutline,
	mdiFullscreen,
	mdiImage,
	mdiMapMarkerOutline,
	mdiMenu,
	mdiPencil,
	mdiPlus,
	mdiPrinter,
	mdiRefresh,
	mdiStopCircleOutline,
	mdiTrashCanOutline,
	mdiUnfoldMoreHorizontal,
	mdiUpload,
	mdiVectorPolygon,
	mdiVectorPolyline,
	mdiVolumeHigh,
	mdiWeb,
} from '@mdi/js';

// Find icons here: https://pictogrammers.com/library/mdi/
const iconMap: Record<string, string> = {
	mdiAlert,
	mdiAlertCircleOutline,
	mdiArrowCollapse,
	mdiArrowExpand,
	mdiArrowULeftTop,
	mdiCamera,
	mdiCheck,
	mdiCheckboxMarkedCircleOutline,
	mdiCheckCircle,
	mdiChevronDown,
	mdiChevronUp,
	mdiClose,
	mdiCogOutline,
	mdiContentSave,
	mdiCrosshairsGps,
	mdiDotsVertical,
	mdiDownload,
	mdiDragVertical,
	mdiEyeOutline,
	mdiFileOutline,
	mdiFullscreen,
	mdiImage,
	mdiMapMarkerOutline,
	mdiMenu,
	mdiPencil,
	mdiPlus,
	mdiPrinter,
	mdiRefresh,
	mdiStopCircleOutline,
	mdiTrashCanOutline,
	mdiUnfoldMoreHorizontal,
	mdiUpload,
	mdiVectorPolygon,
	mdiVectorPolyline,
	mdiVolumeHigh,
	mdiWeb,
};

type IconName = keyof typeof iconMap;
type IconVariant = 'base' | 'error' | 'inverted' | 'muted' | 'primary' | 'success' | 'warning';
type IconSize = 'md' | 'sm';

/**
 * Defines the icon's display and appearance.
 *
 * @property {IconName} name - The name of the icon to render.
 * @property {IconSize} size - The size of the icon applied to the SVG's width and height. Defaults to 'md'.
 * @property {IconVariant} variant - The style variant of the icon. Defaults to 'base'.
 */
interface IconProps {
	name: IconName;
	size?: IconSize;
	variant?: IconVariant;
}

const props = defineProps<IconProps>();
const iconData = computed(() => iconMap[props.name]);
const iconVariant = computed(() => props.variant ?? 'base');
const iconSize = computed(() => props.size ?? 'md');
</script>

<template>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class="odk-icon"
		:class="[iconVariant, `odk-icon-${iconSize}`]"
	>
		<path :d="iconData" />
	</svg>
</template>

<style scoped lang="scss">
.odk-icon {
	display: inline-block;
	vertical-align: middle;
	overflow: visible;
}

.odk-icon.base path {
	fill: var(--odk-text-color);
}

.odk-icon.primary path {
	fill: var(--odk-primary-text-color);
}

.odk-icon.inverted path {
	fill: var(--odk-inverted-text-color);
}

.odk-icon.muted path {
	fill: var(--odk-muted-text-color);
}

.odk-icon.error path {
	fill: var(--odk-error-text-color);
}

.odk-icon.warning path {
	fill: var(--odk-warning-text-color);
}

.odk-icon.success path {
	fill: var(--odk-success-text-color);
}

.odk-icon.odk-icon-sm {
	height: 14px;
	width: 14px;

	path {
		transform: scale(0.8) translate(-4px, -4px);
	}
}

.odk-icon.odk-icon-md {
	height: 20px;
	width: 20px;

	path {
		transform: translate(-2px, -2px);
	}
}
</style>
