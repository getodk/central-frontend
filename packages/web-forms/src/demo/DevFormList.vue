<script lang="ts" setup>
import { xformFixturesByCategory } from '@getodk/common/fixtures/xforms.ts';
import { RouterLink } from 'vue-router';
</script>

<template>
	<div class="dev-form-list-component">
		<h1>Demo Forms for DEV</h1>
		<ul class="category-list">
			<li
				v-for="[groupName, fixtures] of xformFixturesByCategory"
				:key="groupName"
			>
				<details>
					<summary>{{ groupName }}</summary>

					<ul class="form-list">
						<li v-for="fixture in fixtures" :key="fixture.resourceURL.href">
							<RouterLink :to="`/form/${groupName}/${fixture.identifier}`">
								{{ fixture.identifier }}
							</RouterLink>
						</li>
					</ul>
				</details>
			</li>
		</ul>
	</div>
</template>

<style scoped>
h1 {
	margin-left: 10px;
	padding-top: 20px;
}

.category-list {
	padding: 0;

	> li {
		list-style: none;
		cursor: pointer;
		margin: 10px;
		font-size: 20px;

		summary {
			padding: 0.5rem;

			&:hover {
				background-color: var(--gray-100);
			}
		}

		ul.form-list {
			padding: 0 0 0 20px;

			li {
				list-style: none;
				margin: 10px;
				border: 1px solid var(--primary-500);
				border-radius: 10px;
				cursor: pointer;
				background-color: var(--surface-0);
				font-size: 16px;

				a {
					display: block;
					padding: 10px;
					text-decoration: none;
					color: var(--gray-900);

					&:visited {
						color: var(--gray-900);
					}
				}
			}

			li:hover {
				background-color: var(--primary-50);
			}
		}
	}
}
</style>
