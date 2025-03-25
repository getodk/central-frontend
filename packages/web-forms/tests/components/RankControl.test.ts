import { describe, expect, it } from 'vitest';
import { DOMWrapper, mount, VueWrapper } from '@vue/test-utils';
import { getReactiveForm, globalMountOptions } from '../helpers';
import QuestionList from '@/components/QuestionList.vue';
import FormQuestion from '@/components/FormQuestion.vue';
import SelectControl from '@/components/controls/SelectControl.vue';
import RankControl from '@/components/controls/RankControl.vue';
import type { RankNode } from '@getodk/xforms-engine';

describe('RankControl', () => {
	const getAllOptions = (rankControl: VueWrapper): string[] => {
		return rankControl.findAll('.rank-label').map((element) => element.text());
	};

	const clickOnRankItemsButton = async (rankControl: VueWrapper) => {
		const button = rankControl.find('.rank-overlay button');
		expect(button.exists()).toBe(true);
		await button.trigger('click');
	};

	const getRankControlWithRandomize = async () => {
		const xform = await getReactiveForm('1-rank.xml');

		const component = mount(FormQuestion, {
			props: {
				question: xform.currentState.children[0] as RankNode,
			},
			global: globalMountOptions,
		});

		return component.findComponent(RankControl) as VueWrapper;
	};

	const getQuestionListWithChoiceFilter = async () => {
		const xform = await getReactiveForm('2-rank-with-choice-filter.xml');

		return mount(QuestionList, {
			props: {
				nodes: xform.currentState.children,
			},
			global: globalMountOptions,
		}) as VueWrapper;
	};

	const swapItems = (options: string[], indexA: number, indexB: number) => {
		const temp = options[indexA];
		options[indexA] = options[indexB];
		options[indexB] = temp;
	};

	const moveOptionUp = async (rankControl: VueWrapper, optionIndex: number) => {
		const buttonMoveUp: DOMWrapper<HTMLElement> = rankControl.find(
			`.rank-option:nth-child(${optionIndex}) button:first-child`
		);
		expect(buttonMoveUp.exists()).toBe(true);
		await buttonMoveUp.trigger('click');
	};

	const moveOptionDown = async (rankControl: VueWrapper, optionIndex: number) => {
		const buttonMoveUp: DOMWrapper<HTMLElement> = rankControl.find(
			`.rank-option:nth-child(${optionIndex}) button:nth-child(2)`
		);
		expect(buttonMoveUp.exists()).toBe(true);
		await buttonMoveUp.trigger('click');
	};

	const selectOption = async (element: DOMWrapper<Element>) => {
		const checkbox: DOMWrapper<HTMLInputElement> = element.find('input[type=checkbox]');
		await checkbox.setValue(true);
	};

	it('should render all options', async () => {
		const expectedOptions = [
			'Career Growth and Learning Opportunities',
			'Building a Supportive Community',
			'Financial Stability',
			'Pursuit of Hobbies and Passions',
			'Health',
			'Family and Friends',
			'Personal Development and Mindfulness',
			'Environmental Sustainability',
			'Creativity and Innovation',
			'Time Management and Work-Life Balance',
		];

		const rankControl = await getRankControlWithRandomize();
		expect(rankControl.exists()).toBe(true);

		await clickOnRankItemsButton(rankControl);
		const allOptions = getAllOptions(rankControl);
		expect(allOptions.length).toEqual(10);
		expect(allOptions).have.all.members(expectedOptions);
	});

	it('should rank options using buttons', async () => {
		const rankControl = await getRankControlWithRandomize();
		expect(rankControl.exists()).toBe(true);

		await clickOnRankItemsButton(rankControl);
		const expectedOptions = getAllOptions(rankControl);
		swapItems(expectedOptions, 4, 3);
		swapItems(expectedOptions, 6, 7);

		await moveOptionUp(rankControl, 5);
		await moveOptionDown(rankControl, 7);

		const allRankedOptions = getAllOptions(rankControl);
		expect(allRankedOptions).toEqual(expectedOptions);
	});

	it('should not move options if they are the first or last one', async () => {
		const rankControl = await getRankControlWithRandomize();
		expect(rankControl.exists()).toBe(true);

		await clickOnRankItemsButton(rankControl);
		const expectedOptions = getAllOptions(rankControl);
		swapItems(expectedOptions, 3, 2);

		await moveOptionUp(rankControl, 1);
		await moveOptionUp(rankControl, 4);
		await moveOptionDown(rankControl, 10);

		const allRankedOptions = getAllOptions(rankControl);
		expect(allRankedOptions).toEqual(expectedOptions);
	});

	it('should render filtered options when rank has choice-filter configured', async () => {
		const questionListControl = await getQuestionListWithChoiceFilter();
		const formQuestions = questionListControl.findAllComponents(FormQuestion);
		expect(formQuestions).length(1);

		const selectControl = formQuestions[0].findComponent(SelectControl) as VueWrapper;
		expect(selectControl.exists()).toBe(true);
		const selectOptions = selectControl.findAll('.value-option');
		expect(selectOptions).length(10);

		await selectOption(selectOptions[5]);
		await selectOption(selectOptions[9]);

		const refreshedFormQuestions = questionListControl.findAllComponents(FormQuestion);
		expect(refreshedFormQuestions).length(2);
		const rankControl = refreshedFormQuestions[1].findComponent(RankControl) as VueWrapper;
		expect(rankControl.exists()).toBe(true);

		await clickOnRankItemsButton(rankControl);
		const rankOptions = getAllOptions(rankControl);
		expect(rankOptions).length(2);
		expect(rankOptions).toEqual(['Environmental Sustainability', 'Creativity and Innovation']);

		await moveOptionUp(rankControl, 2);
		await selectOption(selectOptions[1]);

		const orderedRankOptions = getAllOptions(rankControl);
		expect(orderedRankOptions).length(3);
		expect(orderedRankOptions).toEqual([
			'Creativity and Innovation',
			'Environmental Sustainability',
			'Family and Friends',
		]);
	});
});
