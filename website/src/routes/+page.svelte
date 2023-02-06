<script lang="ts">
	import { slide } from 'svelte/transition';
	import {
		type Calculation,
		CalculationHistory,
		isCalculatorLoaded,
		calculate,
	} from '../calculation';
	import History from '../lib/history.svelte';

	let pendingCalculationOnceLoaded: string;
	let isLoading = !isCalculatorLoaded(() => {
		isLoading = false;
		if (pendingCalculationOnceLoaded) {
			submitCalculation(pendingCalculationOnceLoaded);
			pendingCalculationOnceLoaded = undefined;
		}
	});

	let suggestionsEnabled = false;
	if (typeof window !== 'undefined') {
		suggestionsEnabled = location.hash === '#suggest';
		window.onhashchange = () => {
			suggestionsEnabled = location.hash === '#suggest';
		};
	}

	let currentInput = '';
	let currentResult: string | null = null;
	$: {
		currentResult = null;
		if (currentInput !== '') {
			try {
				const result = calculate(currentInput, 20);
				if (result.severity !== 'error' && result.output.length < 200) {
					currentResult = result.output;
				}
			} catch (e) {
				currentResult = 'Error';
			}
		}
	}
	let calculations: Calculation[] = CalculationHistory.load();

	function clearHistory() {
		calculations = CalculationHistory.reset();
	}

	function submitCalculation(input: string) {
		if (isLoading) {
			pendingCalculationOnceLoaded = input;
			return;
		}
		calculations = [
			calculate(input),
			...calculations.filter((c) => c.rawInput !== input),
		];
		if (calculations.length > 30) {
			calculations = calculations.slice(0, 30);
		}
		window.localStorage?.setItem(
			'qalculator-history',
			JSON.stringify(calculations),
		);
	}

	function submitCalculationFromInput() {
		if (
			currentInput === '' || // nothing to calculate
			(calculations.length > 0 &&
				currentInput === calculations[0].rawInput && // same calculation as before
				!calculations[0].id.startsWith('tut')) // only allow that for tutorials
		)
			return;
		submitCalculation(currentInput);
		currentInput = '';
	}

	function keyup(ev: KeyboardEvent) {
		if (ev.key === 'Enter') {
			submitCalculationFromInput();
			hideSuggestions();
		}
		if (suggestionsEnabled && ev.key === 'Escape') {
			hideSuggestions();
		}
		if (
			suggestionsEnabled &&
			ev.key === 'ArrowDown' &&
			suggestions.length > 0
		) {
			if (selectedSuggestion === '') {
				selectedSuggestion = suggestions[0].name;
			} else {
				const index = suggestions.findIndex(
					(s) => s.name === selectedSuggestion,
				);
				selectedSuggestion =
					suggestions[(index + 1) % suggestions.length].name;
			}
			return;
		}
		if (
			suggestionsEnabled &&
			ev.key === 'ArrowUp' &&
			suggestions.length > 0
		) {
			if (selectedSuggestion === '') {
				selectedSuggestion = suggestions[suggestions.length - 1].name;
			} else {
				const index = suggestions.findIndex(
					(s) => s.name === selectedSuggestion,
				);
				selectedSuggestion =
					suggestions[
						(index + suggestions.length - 1) % suggestions.length
					].name;
			}
			return;
		}
		if (suggestionsEnabled && ev.key.length === 1) {
			const textUpToSelection = ev.target.value.substring(
				0,
				ev.target.selectionStart,
			);
			if (!/[\p{L}_\d]/u.exec(ev.key) && selectedSuggestion) {
				const wordUpToSelection = /\p{L}[\p{L}_\d]*$/u.exec(
					ev.target.value.substring(0, ev.target.selectionStart - 1),
				);
				if (wordUpToSelection) {
					const newSelectionPos =
						ev.target.selectionStart -
						wordUpToSelection[0].length +
						selectedSuggestion.length;

					ev.target.value =
						textUpToSelection.substring(
							0,
							ev.target.selectionStart -
								1 -
								wordUpToSelection[0].length,
						) +
						selectedSuggestion +
						ev.target.value.substring(ev.target.selectionStart - 1);
					ev.target.selectionStart = ev.target.selectionEnd =
						newSelectionPos;
					hideSuggestions();
					return;
				}
			}
			createSuggestions(textUpToSelection);
		} else if (!['Control', 'Alt', 'Shift', 'AltGraph'].includes(ev.key)) {
			hideSuggestions();
		}
	}
	let inputElement: HTMLInputElement;
	function selectCalculation(calc: string) {
		currentInput = calc;
		inputElement.focus();
	}

	let windowBluring = false;
	function windowBlur() {
		windowBluring = true;
		setTimeout(() => (windowBluring = false), 250);
	}
	function inputBlur() {
		setTimeout(() => {
			if (!windowBluring) {
				submitCalculationFromInput();
			}
		}, 100);
		hideSuggestions();
	}

	let suggestions: { name: string; description: string }[] = [];
	let selectedSuggestion = '';
	function createSuggestions(text: string) {
		const lastWordSelector = /\p{L}[\p{L}_\d]*$/u.exec(text);
		if (!lastWordSelector) {
			hideSuggestions();
			return;
		}
		const lastWord = lastWordSelector[0];

		suggestions = Module.variables
			.map((v) => ({
				match: v.aliases.some((a) => a === lastWord),
				partialMatch:
					v.aliases.some((a) => a.startsWith(lastWord)) ||
					(v.name === 'ℎ' && lastWord === 'h'),
				...v,
			}))
			.filter((v) => v.partialMatch)
			.sort((a, b) => +b.match - +a.match);
		if ((suggestions as any)?.[0]?.match) {
			selectedSuggestion = suggestions[0].name;
		}
	}
	function hideSuggestions() {
		suggestions = [];
		selectedSuggestion = '';
	}
</script>

<svelte:window on:blur={windowBlur} />
<div class="content">
	<h1>Qalculator</h1>
	<input
		type="text"
		placeholder="Your calculation"
		autocomplete="off"
		class="query"
		autofocus
		spellcheck="false"
		bind:value={currentInput}
		bind:this={inputElement}
		on:keyup={keyup}
		on:blur={inputBlur}
	/>
	<div class="suggestion-host">
		<div class="suggestions">
			{#each suggestions as suggestion (suggestion.name)}
				<div class:selected={suggestion.name === selectedSuggestion}>
					{suggestion.name}
					{#if suggestion.description}
						<span class="description">{suggestion.description}</span
						>
					{/if}
				</div>
			{/each}
		</div>
	</div>
	<div class="directResult" transition:slide>
		{#if currentResult}
			= {@html currentResult}
		{/if}
	</div>
	<History
		{calculations}
		showLoadingIndicator={isLoading && !!pendingCalculationOnceLoaded}
		onselectcalculation={selectCalculation}
		onclearhistory={clearHistory}
	/>
	<div class="disclaimer">
		by Stephan Troyer, powered by
		<a href="https://github.com/Qalculate/libqalculate">libqalculate</a>
	</div>
</div>

{@html '<scr' + 'ipt src="/calc.js" async></script>'}

<style>
	.content {
		width: 90vw;
		width: calc(
			100vw - 2 *
				max(env(safe-area-inset-right), env(safe-area-inset-left), 5vw)
		);
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
		font-size: 20px;
		position: fixed;
		top: 0;
		bottom: 0;
		left: 5vw;
		right: 5vw;
		display: flex;
		flex-direction: column;
	}

	h1 {
		padding: 20px 0;
		padding: max(min(20px, 2vh), env(safe-area-inset-top)) 0 min(20px, 2vh);
		font-size: 3.5rem;
		font-size: max(min(3.5rem, 10vh), 1.5rem);
	}

	.query {
		width: 100%;
		border: none;
		border-radius: 25px;
		height: 50px;
		padding: 0 20px;
		background: #344;
		color: #eff;
		text-align: center;
		margin-bottom: 10px;
	}
	.query::placeholder {
		color: #dee;
		opacity: 0.5;
		text-align: center;
	}

	.directResult {
		min-height: 1.5rem;
	}

	.disclaimer {
		font-size: 0.9rem;
		font-size: max(min(0.9rem, 2.5vh), 0.6rem);
		opacity: 0.5;
		line-height: 1.25;
		margin: 7px 10px;
		margin: 7px 10px calc(max(7px, env(safe-area-inset-bottom)));
	}

	.suggestion-host {
		position: relative;
		margin: 0 25px;
		display: flex;
		justify-content: center;
	}

	.suggestions {
		position: absolute;
		background: #344;
		text-align: left;
		overflow-x: hidden;
		overflow-y: auto;
		white-space: nowrap;
		max-height: 6em;
		max-width: 20em;
		z-index: 1;
		box-shadow: rgba(0, 0, 0, 0.5) 0 2px 10px;
		border-radius: 5px;
		margin-top: 1.5rem;
	}

	.suggestions > div {
		padding: 2px 5px;
	}
	.suggestions > div.selected {
		background: #cdd;
		color: #122;
	}

	.suggestions .description {
		font-style: italic;
		font-size: 0.8em;
		opacity: 0.8;
	}
</style>
