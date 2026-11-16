<script setup lang="ts">
import IconSVG from '@getodk/web-forms/components/common/IconSVG.vue';
import {
	type PlaceSearchResult,
	usePlaceSearch,
} from '@getodk/web-forms/components/common/map/usePlaceSearch.ts';
import { TRANSLATE } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import type { Translate } from '@getodk/web-forms/lib/locale/useLocale.ts';
import type { Extent } from 'ol/extent';
import { inject, onBeforeUnmount } from 'vue';

const props = defineProps<{ apiKey: string }>();
const emit = defineEmits<{ selectPlace: [lonLatViewport: Extent] }>();
const t: Translate = inject(TRANSLATE)!;

const {
	query,
	places,
	isOpen,
	hasPlaces,
	hasError,
	activate,
	scheduleSearch,
	searchNow,
	select,
	dismiss,
	cancel,
} = usePlaceSearch(props.apiKey);

const selectPlace = (place: PlaceSearchResult) => {
	select(place);
	emit('selectPlace', place.lonLatViewport);
};

const onEscape = (event: KeyboardEvent) => {
	// Only an open list consumes Escape, so the next Escape still exits map full screen.
	if (isOpen.value) {
		event.stopPropagation();
	}
	dismiss();
};

const onFocusOut = (event: FocusEvent) => {
	const container = event.currentTarget as HTMLElement;
	if (!container.contains(event.relatedTarget as Node | null)) {
		dismiss();
	}
};

onBeforeUnmount(() => cancel());
</script>

<template>
	<div class="map-place-search" @focusout="onFocusOut">
		<div class="search-input">
			<IconSVG name="mdiMagnify" variant="muted" />
			<input
				v-model="query"
				type="text"
				autocomplete="off"
				:aria-label="t('map_place_search.input.placeholder')"
				:placeholder="t('map_place_search.input.placeholder')"
				@input="scheduleSearch"
				@focus="activate"
				@keydown.enter.prevent="searchNow"
				@keydown.esc="onEscape"
			>
		</div>

		<ul
			v-if="isOpen && hasPlaces"
			class="search-results"
			:aria-label="t('map_place_search.results.label')"
		>
			<li v-for="(place, index) in places" :key="`${place.label}-${index}`">
				<button type="button" @pointerdown.prevent @click="selectPlace(place)">
					{{ place.label }}
				</button>
			</li>
		</ul>

		<div v-else-if="isOpen && hasError" class="search-results search-message" role="alert">
			{{ t('map_place_search.error.message') }}
		</div>

		<div v-else-if="isOpen" class="search-results search-message" role="status">
			{{ t('map_place_search.no_results.text') }}
		</div>
	</div>
</template>

<style scoped lang="scss">
.map-place-search {
	--map-control-width: 40px;
	--horizontal-gaps: calc(3 * var(--odk-spacing-m));

	position: absolute;
	top: var(--odk-spacing-m);
	left: var(--odk-spacing-m);
	width: 420px;
	max-width: calc(100% - var(--map-control-width) - var(--horizontal-gaps));
	z-index: var(--odk-z-index-form-content);
	font-size: var(--odk-base-font-size);

	input,
	button {
		border: none;
		background: none;
		font: inherit;
		color: var(--odk-text-color);
	}
}

.search-input,
.search-results {
	border: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);
	background: var(--odk-base-background-color);
}

.search-input {
	display: flex;
	align-items: center;
	gap: var(--odk-spacing-s);
	height: var(--map-control-width);
	padding: 0 var(--odk-spacing-m);

	&:focus-within {
		border-color: var(--odk-primary-border-color);
	}

	input {
		flex: 1;
		min-width: 0;
		outline: none;

		&::placeholder {
			color: var(--odk-muted-text-color);
		}
	}
}

.search-results {
	margin: var(--odk-spacing-s) 0 0;
	padding: var(--odk-spacing-s) 0;
	list-style: none;

	button {
		display: block;
		width: 100%;
		padding: var(--odk-spacing-s) var(--odk-spacing-m);
		text-align: left;
		cursor: pointer;

		&:hover,
		&:focus-visible {
			background: var(--odk-primary-lighter-background-color);
		}
	}

	&.search-message {
		padding: var(--odk-spacing-s) var(--odk-spacing-m);
		color: var(--odk-muted-text-color);
	}
}
</style>
