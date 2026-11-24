<script setup lang="ts">
import IconSVG from '@getodk/web-forms/components/common/IconSVG.vue';
import {
	type PlaceSearchResult,
	usePlaceSearch,
} from '@getodk/web-forms/components/common/map/usePlaceSearch.ts';
import { TRANSLATE } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import { focusNext, focusPrevious } from '@getodk/web-forms/lib/dropdown.ts';
import type { Translate } from '@getodk/web-forms/lib/locale/useLocale.ts';
import ProgressSpinner from 'primevue/progressspinner';
import { inject, onBeforeUnmount, ref } from 'vue';

const props = defineProps<{ apiKey: string }>();
const emit = defineEmits<{ selectPlace: [place: PlaceSearchResult] }>();
const t: Translate = inject(TRANSLATE)!;
const isCollapsed = ref(true);

const {
	query,
	places,
	isOpen,
	isSearching,
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
	emit('selectPlace', place);
};

const onEscape = (event: KeyboardEvent) => {
	// Only an open list consumes Escape, so the next Escape still exits map full screen.
	if (isOpen.value) {
		event.stopPropagation();
	}
	dismiss();
};

const onFocusIn = () => {
	isCollapsed.value = false;
	activate();
};

const onFocusOut = (event: FocusEvent) => {
	const container = event.currentTarget as HTMLElement;
	if (!container.contains(event.relatedTarget as Node | null)) {
		dismiss();
		isCollapsed.value = true;
	}
};

onBeforeUnmount(() => cancel());
</script>

<template>
	<div
		class="map-place-search"
		:class="{ collapsed: isCollapsed }"
		@focusout="onFocusOut"
		@keydown.down.prevent.stop="focusNext"
		@keydown.up.prevent.stop="focusPrevious"
		@keydown.esc="onEscape"
	>
		<div class="search-input">
			<IconSVG name="mdiMagnify" />
			<input
				v-model="query"
				type="text"
				autocomplete="off"
				:aria-label="t('map_place_search.input.placeholder')"
				:placeholder="t('map_place_search.input.placeholder')"
				@input="scheduleSearch"
				@focus="onFocusIn"
				@keydown.enter.prevent="searchNow"
			>
			<ProgressSpinner v-if="isSearching" class="search-spinner" stroke-width="5px" />
		</div>

		<div v-if="isOpen" class="search-results">
			<ul v-if="hasPlaces" role="listbox" :aria-label="t('map_place_search.results.label')">
				<li
					v-for="(place, index) in places"
					:key="`${place.label}-${index}`"
					role="option"
					tabindex="0"
					class="search-row search-option"
					@pointerdown.prevent
					@click="selectPlace(place)"
					@keydown.enter.space.prevent="selectPlace(place)"
				>
					{{ place.label }}
				</li>
			</ul>

			<div v-else-if="hasError" class="search-row search-error" role="alert">
				{{ t('map_place_search.error.message') }}
			</div>

			<div v-else class="search-row search-message" role="status">
				{{ t('map_place_search.no_results.text') }}
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

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
	color: var(--odk-text-color);
}

@media screen and (max-width: #{pf.$sm}) {
	.map-place-search {
		transition: max-width var(--odk-transition-duration);
	}

	.search-input input {
		transition: opacity var(--odk-transition-duration);
	}

	.search-results {
		animation: show-after-slide 0s var(--odk-transition-duration) backwards;
	}

	.map-place-search.collapsed {
		max-width: var(--map-control-width);

		.search-input input {
			position: absolute;
			inset: 0;
			opacity: 0;
			transition: none;
		}
	}
}

@keyframes show-after-slide {
	from {
		visibility: hidden;
	}
}

.search-input,
.search-results {
	border: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);
	background: var(--odk-base-background-color);
}

.map-place-search:focus-within {
	.search-input,
	.search-results {
		border-color: var(--odk-primary-border-color);
	}

	.search-input:has(+ .search-results) {
		border-bottom-color: var(--odk-border-color);
	}
}

.search-input {
	position: relative;
	display: flex;
	align-items: center;
	gap: var(--odk-spacing-s);
	height: var(--map-control-width);
	padding: 0 var(--odk-spacing-m);

	&:has(+ .search-results) {
		border-radius: var(--odk-radius) var(--odk-radius) 0 0;
	}

	input {
		flex: 1;
		min-width: 0;
		border: none;
		background: none;
		font: inherit;
		color: inherit;
		outline: none;

		&::placeholder {
			color: var(--odk-muted-text-color);
		}
	}
}

.search-spinner {
	flex-shrink: 0;
	width: var(--odk-icon-m);
	height: var(--odk-icon-m);
}

.search-results {
	padding: var(--odk-spacing-s);
	border-top: none;
	border-radius: 0 0 var(--odk-radius) var(--odk-radius);

	ul {
		display: flex;
		flex-direction: column;
		gap: var(--odk-spacing-s);
		margin: 0;
		padding: 0;
		list-style: none;
	}
}

.search-row {
	padding: 8px var(--odk-spacing-m);
	border-radius: var(--odk-radius);
}

.search-option {
	cursor: pointer;

	&:hover {
		background: var(--odk-muted-background-color);
	}

	&:focus-visible {
		outline: none;
		background: var(--odk-primary-lighter-background-color);
	}
}

.search-message {
	color: var(--odk-muted-text-color);
}

.search-error {
	color: var(--odk-error-text-color);
}
</style>
