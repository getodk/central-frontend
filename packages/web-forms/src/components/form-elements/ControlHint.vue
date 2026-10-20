<script setup lang="ts">
import MarkdownBlock from '@getodk/web-forms/components/common/MarkdownBlock.vue';
import type { AnyControlNode as QuestionNode } from '@getodk/xforms-engine';
import { computed, inject } from 'vue';
import { TRANSLATE } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import type { Translate } from '@getodk/web-forms/lib/locale/useLocale.ts';
import IconSVG from '@getodk/web-forms/components/common/IconSVG.vue';

const t: Translate = inject(TRANSLATE)!;

const props = defineProps<{ question: QuestionNode }>();

const label = computed(() => props.question.currentState.hint?.formatted);
const guidanceHint = computed(() => props.question.currentState.hint?.guidance);
</script>

<template>
	<div v-if="question.currentState.hint" class="hint">
		<div>
			<MarkdownBlock v-for="elem in label" :key="elem.id" :elem="elem" />
		</div>
		<div v-if="guidanceHint?.length">
			<details>
				<summary tabindex="-1">
					<span class="chevron-closed"><IconSVG name="mdiChevronDown" variant="muted" /></span>
					<span class="chevron-open"><IconSVG name="mdiChevronUp" variant="muted" /></span>
					{{ t('control_hint.details.label') }}
				</summary>
				<div>
					<MarkdownBlock v-for="elem in guidanceHint" :key="elem.id" :elem="elem" />
				</div>
			</details>
		</div>
	</div>
</template>

<style scoped lang="scss">
.hint {
	font-size: var(--odk-hint-font-size);
	font-weight: 300;
	color: var(--odk-muted-text-color);
	margin-top: var(--odk-spacing-s);
	line-height: calc(var(--odk-hint-font-size) * 1.45);
	word-wrap: break-word;
	white-space: pre-wrap;
}
details {
	summary {
		cursor: pointer;
		font-weight: bold;
		&::marker {
			content: '';
		}
	}
	.chevron-open {
		display: none;
	}

	.chevron-closed {
		display: inline;
	}
  &[open] {
    .chevron-open {
      display: inline;
    }

    .chevron-closed {
      display: none;
    }
  }
}
</style>
