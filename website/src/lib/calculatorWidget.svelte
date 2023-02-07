<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Calculator } from './calculator';
	import {
		generateSuggestions,
		getLastWord,
		type MatchedSuggestion,
		type Suggestion,
	} from './suggestions';
	import Suggestions from './suggestionsWidget.svelte';

	export let calculator: Calculator;

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

	function keydown(ev: KeyboardEvent) {
		if (ev.key === 'Enter') {
			if (selectedSuggestion && inputElement.selectionStart !== null) {
				acceptSuggestion(
					inputElement.selectionStart,
					selectedSuggestion,
				);
			} else {
				submitCalculationFromInput();
			}
			suggestions = [];
		}
		if (ev.key === 'Escape') {
			suggestions = [];
		}
		if (ev.key === 'ArrowDown' && suggestions.length > 0) {
			ev.preventDefault();
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
		if (ev.key === 'ArrowUp' && suggestions.length > 0) {
			ev.preventDefault();
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
		if (ev.key.length === 1) {
			setTimeout(() => {
				if (inputElement.selectionStart === null) return;
				const textUpToSelection = inputElement.value.substring(
					0,
					inputElement.selectionStart,
				);
				if (!/[\p{L}_\d]/u.exec(ev.key) && selectedSuggestion) {
					const wordUpToSelection = getLastWord(
						inputElement.value.substring(
							0,
							inputElement.selectionStart - 1,
						),
					);
					if (wordUpToSelection) {
						const newSelectionPos =
							inputElement.selectionStart -
							wordUpToSelection.length +
							selectedSuggestion.length;

						inputElement.value =
							textUpToSelection.substring(
								0,
								inputElement.selectionStart -
									1 -
									wordUpToSelection.length,
							) +
							selectedSuggestion +
							inputElement.value.substring(
								inputElement.selectionStart - 1,
							);
						inputElement.selectionStart =
							inputElement.selectionEnd = newSelectionPos;
						suggestions = [];
						return;
					}
				}
				createSuggestions(textUpToSelection);
			}, 10);
		} else if (!['Control', 'Alt', 'Shift', 'AltGraph'].includes(ev.key)) {
			suggestions = [];
		}
	}

	let inputElement: HTMLInputElement;
	export function selectCalculation(calc: string) {
		currentInput = calc;
		inputElement.focus();
	}

	let windowBluring = false;
	let suggestionBluring = false;
	function windowBlur() {
		windowBluring = true;
		setTimeout(() => (windowBluring = false), 250);
	}
	let backedUpInputSelectionStart: number | null = null;
	function inputBlur() {
		backedUpInputSelectionStart = inputElement.selectionStart;
		setTimeout(() => {
			if (!windowBluring && !suggestionBluring) {
				submitCalculationFromInput();
				suggestions = [];
				backedUpInputSelectionStart = null;
			}
		}, 100);
	}

	let suggestions: Suggestion[] = [];
	let selectedSuggestion: string = '';
	$: if (!suggestions.some((s) => s.name === selectedSuggestion))
		selectedSuggestion = '';

	function acceptSuggestion(selectionStart: number, replacement: string) {
		const value = inputElement.value;
		const textUpToSelection = value.substring(0, selectionStart);
		const wordUpToSelection = /\p{L}[\p{L}_\d]*$/u.exec(
			value.substring(0, selectionStart),
		);
		if (wordUpToSelection) {
			inputElement.value =
				textUpToSelection.substring(
					0,
					selectionStart - wordUpToSelection[0].length,
				) +
				replacement +
				value.substring(selectionStart);
			inputElement.selectionStart = inputElement.selectionEnd =
				textUpToSelection.length -
				wordUpToSelection[0].length +
				replacement.length;
		}
		suggestions = [];
	}

	function createSuggestions(text: string) {
		suggestions = generateSuggestions(text);
		if ((suggestions as MatchedSuggestion[])?.[0]?.match) {
			selectedSuggestion = suggestions[0].name;
		}
	}

	function suggestionClicked(suggestion: string) {
		const selStart =
			inputElement.selectionStart ?? backedUpInputSelectionStart;
		if (selStart === null) return;
		suggestionBluring = true;
		setTimeout(() => (suggestionBluring = false), 250);
		setTimeout(() => inputElement.focus(), 0);
		acceptSuggestion(selStart, suggestion);
	}
</script>

<svelte:window on:blur={windowBlur} />
<!-- svelte-ignore a11y-autofocus -->
<input
	type="text"
	placeholder="Your calculation"
	autocomplete="off"
	class="query"
	autofocus
	spellcheck="false"
	bind:value={currentInput}
	bind:this={inputElement}
	on:keydown={keydown}
	on:blur={inputBlur}
/>

<div class="directResult" transition:slide>
	{#if currentResult}
		= {@html currentResult}
	{/if}
</div>

<Suggestions
	{suggestions}
	{selectedSuggestion}
	acceptSuggestion={suggestionClicked}
/>

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
