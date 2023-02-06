<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Calculator } from '../calculator';
	import Suggestions from './suggestions.svelte';

	export let calculator: Calculator;

	let suggestionsEnabled = false;
	if (typeof window !== 'undefined') {
		suggestionsEnabled = window.location.hash === '#suggest';
		window.onhashchange = () => {
			suggestionsEnabled = window.location.hash === '#suggest';
		};
	}

	let currentInput = '';
	let currentResult: string | null = null;
	$: {
		currentResult = null;
		if (currentInput !== '' && calculator.isLoaded) {
			try {
				const result = calculator.calculate(currentInput, 20);
				if (result.severity !== 'error' && result.output.length < 200) {
					currentResult = result.output;
				}
			} catch (e) {
				currentResult = 'Error';
			}
		}
	}

	function submitCalculationFromInput() {
		if (
			currentInput === '' || // nothing to calculate
			(calculator.history.entries.length > 0 &&
				currentInput === calculator.history.entries[0].rawInput && // same calculation as before
				!calculator.history.entries[0].id.startsWith('tut')) // only allow that for tutorials
		)
			return;
		calculator.submitCalculation(currentInput);
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
	export function selectCalculation(calc: string) {
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

<div class="directResult" transition:slide>
	{#if currentResult}
		= {@html currentResult}
	{/if}
</div>

<Suggestions {suggestions} {selectedSuggestion} />

<style>
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
</style>
