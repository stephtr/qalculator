<script lang="ts">
	import { slide } from 'svelte/transition';
	import { trackEvent } from '../routes/tracking';
	import type { Calculator } from './calculator';
	import { setOption } from './calculatorModule';
	import {
		generateSuggestions,
		getLastWord,
		type Suggestion,
	} from './suggestions';
	import Suggestions from './suggestionsWidget.svelte';

	export let calculator: Calculator;

	let inputElement: HTMLInputElement;

	let currentInput = '';
	let currentResult = '';
	export function updateCurrentResult(_: any, ensureResult = false) {
		const isSetCommand = currentInput.startsWith('set ');
		const isAssignment =
			currentInput.includes(':=') || /^\s*\w+\s*=/.test(currentInput);
		if (isSetCommand || isAssignment) {
			currentResult = '';
			return;
		}
		currentResult = '';
		if (currentInput !== '' && calculator.isLoaded) {
			try {
				const result = calculator.calculate(
					currentInput,
					ensureResult ? 500 : 50,
				);
				// only show the result if it's not too long
				// otherwise it could also be a product of an incomplete query
				if (
					result.severity !== 'error' &&
					(result.output.length < 200 || ensureResult)
				) {
					currentResult = result.output;
				}
			} catch (e) {
				currentResult = 'Error';
			}
		}
	}
	// let's get a fresh as-you-type result, whenever `currentInput` changes
	$: updateCurrentResult(currentInput);

	let suggestions: Suggestion[] = [];
	let selectedSuggestion: string = '';
	$: if (!suggestions.some((s) => s.name === selectedSuggestion))
		selectedSuggestion = '';

	let scrollSuggestionIntoView: (suggestion: string) => void;

	function submitCalculationFromInput(submittedByBlur: boolean) {
		const isSetCommand = currentInput.startsWith('set ');
		if (currentInput === '' || (isSetCommand && submittedByBlur)) return; // nothing to calculate
		if (isSetCommand) {
			const success = setOption(currentInput.slice(4));
			if (success) {
				currentInput = '';
			} else {
				currentResult = 'Error';
			}
			return;
		}
		trackEvent(
			'calculator',
			'submit',
			submittedByBlur ? 'by blur' : 'by enter',
		);
		if (submitOnBlur) {
			calculator.submitCalculation(currentInput);
			currentInput = '';
		} else {
			updateCurrentResult(currentInput, true);
		}
	}

	function keydown(ev: KeyboardEvent) {
		if (ev.key === 'Unidentified') return;
		if (ev.key === 'Enter') {
			if (selectedSuggestion && inputElement.selectionStart !== null) {
				acceptSuggestion(
					inputElement.selectionStart,
					selectedSuggestion,
				);
			} else {
				submitCalculationFromInput(false);
			}
			suggestions = [];
		}
		if (ev.key === 'Escape') {
			suggestions = [];
		}
		if (ev.key === 'ArrowDown' && suggestions.length > 0) {
			// let's choose the (next) suggestion
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
			scrollSuggestionIntoView(selectedSuggestion);
			return;
		}
		if (ev.key === 'ArrowUp' && suggestions.length > 0) {
			// let's choose the (previous) suggestion
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
			scrollSuggestionIntoView(selectedSuggestion);
			return;
		}
		if (ev.key.length === 1) {
			// it seems like a new character was typed
			// let's therefore first wait for it to arrive in the input value
			// (`setTimeout(..., 100)`)
			setTimeout(() => {
				if (inputElement.selectionStart === null) return;
				const textUpToSelection = inputElement.value.substring(
					0,
					inputElement.selectionStart,
				);
				if (!/[\p{L}_\d]/u.exec(ev.key) && selectedSuggestion) {
					// the letter entered does not belong to the previous word,
					// let's therefore accept the already selected suggestion
					const wordUpToSelection = getLastWord(
						inputElement.value.substring(
							0,
							inputElement.selectionStart - 1,
						),
					);
					if (wordUpToSelection) {
						// let's remove the last word and
						// replace it by the constant's primary name/symbol
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
						inputElement.selectionStart = newSelectionPos;
						inputElement.selectionEnd = newSelectionPos;
						suggestions = [];
						return;
					}
				}
				// otherwise, let's update the suggestions
				updateSuggestions(textUpToSelection);
			}, 100);
		} else if (!['Control', 'Alt', 'Shift', 'AltGraph'].includes(ev.key)) {
			// if there is a unknown key pressed, let's cautiously hide the suggestions
			// (except for control keys)
			suggestions = [];
		}
	}

	// Usually, exiting the input's focus submits the calculation;
	// Except for:
	/** the whole browser window lost focus */
	let windowBluring = false;
	/** a suggestion was clicked */
	let suggestionBluring = false;
	/** a history item was clicked */
	let selectBluring = false;

	export let submitOnBlur = true;

	/** loads a calculation */
	export function selectCalculation(calc: string) {
		submitCalculationFromInput(true);
		currentInput = calc;
		inputElement.focus();
		setTimeout(() => updateCurrentResult(currentInput, true), 10);
	}

	/**
	 * give the component a warning that the user is
	 * about to select a calculation, which shouldn't
	 * result in the input focus getting lost
	 */
	export function aboutToSelectCalculation() {
		selectBluring = true;
		// we now have a time window of 250 ms where the code doesn't
		// submit the calculation on loosing the input's focus
		setTimeout(() => (selectBluring = false), 250);
	}

	function windowBlur() {
		windowBluring = true;
		setTimeout(() => (windowBluring = false), 250);
	}

	/**
	 * Sometimes it's necessary to keep the last known selection position
	 * of the input element, for example when the input is loosing focus due
	 * to the user clicking on a suggestion.
	 */
	let backedUpInputSelectionStart: number | null = null;
	function inputBlur() {
		backedUpInputSelectionStart = inputElement.selectionStart;
		setTimeout(() => {
			if (!windowBluring && !suggestionBluring && !selectBluring) {
				if (submitOnBlur) {
					submitCalculationFromInput(true);
				}
				suggestions = [];
				backedUpInputSelectionStart = null;
			}
		}, 100);
	}

	function acceptSuggestion(selectionStart: number, replacement: string) {
		const { value } = inputElement;
		const textUpToSelection = value.substring(0, selectionStart);
		const wordUpToSelection = /\p{L}[\p{L}_\d]*$/u.exec(
			value.substring(0, selectionStart),
		);
		if (wordUpToSelection) {
			// let's replace the last word by the provided replacement/selected suggestion
			currentInput = inputElement.value =
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

	function updateSuggestions(text: string) {
		const suggest = generateSuggestions(text);
		suggestions = suggest;
		if (suggest?.[0]?.match) {
			// we have a match
			if (
				(suggest[0].name !== 'G' && suggest[0].name !== 'c') ||
				suggest[0].matchIdenticalCasing
			)
				// if the constant is G or c, let's require matching casing
				// to not confuse it with J (Joule) or C (Coloumb)
				selectedSuggestion = suggest[0].name;
		}
	}

	function suggestionClicked(suggestion: string) {
		const selStart =
			inputElement.selectionStart ?? backedUpInputSelectionStart;
		if (selStart === null) return;
		suggestionBluring = true;
		acceptSuggestion(selStart, suggestion);
		setTimeout(() => inputElement.focus(), 0);
		setTimeout(() => (suggestionBluring = false), 250);
	}

	// on Android, the keydown event doesn't work as intended.
	// Let's therefore also map the textInput event to the keydown event.
	function textInputDispatcher(node: HTMLInputElement) {
		const handler = (ev: InputEvent) => {
			if (ev.data) keydown({ key: ev.data, ...(ev as any) });
		};
		node.addEventListener('textInput' as any, handler);
		return {
			destroy() {
				node.removeEventListener('textInput' as any, handler);
			},
		};
	}
	export let autofocus = false;
</script>

<svelte:window on:blur={windowBlur} />
<!-- svelte-ignore a11y-autofocus -->
<input
	type="text"
	placeholder="Your calculation"
	autocomplete="calculation-input"
	autocapitalize="none"
	autocorrect="off"
	class="query"
	{autofocus}
	spellcheck="false"
	bind:value={currentInput}
	bind:this={inputElement}
	on:keydown={keydown}
	on:blur={inputBlur}
	use:textInputDispatcher
/>

<div class="directResult" transition:slide>
	{#if currentResult}
		= {@html currentResult}
	{/if}
</div>

<Suggestions
	{suggestions}
	{selectedSuggestion}
	onAcceptSuggestion={suggestionClicked}
	bind:scrollSuggestionIntoView
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
