<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import MediaBlockBase from '@/components/common/media/MediaBlockBase.vue';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { inject, ref } from 'vue';

defineProps<{
	readonly resourceUrl: JRResourceURL;
	readonly alt: string;
	readonly variant?: 'bar' | 'icons';
}>();

const t: Translate = inject(TRANSLATE)!;

const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);

const stop = () => {
	if (!audioRef.value) {
		return;
	}
	audioRef.value.pause();
	isPlaying.value = false;
};

const play = async () => {
	if (!audioRef.value) {
		return;
	}
	try {
		audioRef.value.currentTime = 0;
		await audioRef.value.play();
		isPlaying.value = true;
	} catch {
		isPlaying.value = false;
	}
};
</script>

<template>
	<MediaBlockBase
		v-slot="{ mediaUrl, reportError }"
		:alt="alt"
		broken-file-image="broken-audio.svg"
		:resource-url="resourceUrl"
		:variant="variant === 'icons' ? 'fit-content' : 'full-width'"
	>
		<div :class="{ 'bar-only': !variant || variant === 'bar', 'icons-only': variant === 'icons' }">
			<audio
				ref="audioRef"
				controls
				controlsList="nodownload noplaybackrate"
				:src="mediaUrl"
				:title="alt"
				class="audio-block"
				@ended="isPlaying = false"
				@error="reportError(t('audio_block.load.error', { file: resourceUrl.href ?? '' }))"
			/>
			<template v-if="variant === 'icons'">
				<IconSVG v-if="isPlaying" name="mdiStopCircleOutline" @click.stop.prevent="stop" />
				<IconSVG v-else name="mdiVolumeHigh" @click.stop.prevent="play" />
			</template>
		</div>
	</MediaBlockBase>
</template>

<style scoped lang="scss">
.bar-only {
	width: 100%;
	min-width: 300px;
	max-width: 400px;

	.audio-block {
		width: 100%;
		display: block;
	}
}

.icons-only .audio-block {
	display: none;
}
</style>
