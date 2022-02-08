<script lang="ts">
	import { slide } from 'svelte/transition';
	import {
		Calculation,
		tutorialCalculations,
		parseMessages,
	} from '../calculation';

	let currentInput = '';
	let savedHistory = null;
	if (typeof window !== 'undefined') {
		savedHistory = window.localStorage?.getItem('qalculator-history');
	}
	let calculations: Calculation[] = savedHistory
		? JSON.parse(savedHistory)
		: tutorialCalculations;

	function submitCalculation() {
		if (
			currentInput === '' ||
			(calculations.length > 0 &&
				currentInput === calculations[0].rawInput)
		)
			return;
		const calculation = Module.calculate(currentInput);
		const [messages, severity] = parseMessages(calculation.messages);
		calculations = [
			{
				id: Math.random().toString(),
				input: calculation.input,
				rawInput: currentInput,
				output: calculation.output,
				messages,
				severity,
			},
			...calculations,
		];
		if (calculations.length > 30) {
			calculations = calculations.slice(0, 30);
		}
		calculation.delete();
		currentInput = '';
		window.localStorage?.setItem(
			'qalculator-history',
			JSON.stringify(calculations),
		);
	}

	function keypress(ev: KeyboardEvent) {
		if (ev.key === 'Enter') {
			submitCalculation();
		}
	}
	let inputElement: HTMLInputElement;
	function selectCalculation(calc: string) {
		currentInput = calc;
		inputElement.focus();
	}
</script>

<div class="content">
	<h1>Qalculator</h1>
	<input
		type="text"
		placeholder="Your calculation"
		autocomplete="off"
		class="query"
		autofocus
		bind:value={currentInput}
		bind:this={inputElement}
		on:keypress={keypress}
		on:blur={submitCalculation}
	/>
	<div class="responses">
		{#each calculations as calculation (calculation.id)}
			<div
				on:click={() => selectCalculation(calculation.rawInput)}
				transition:slide
			>
				<div class="input">
					{@html calculation.input}
				</div>
				<div class="output">
					{@html calculation.output}
				</div>
				{#if calculation.messages.length > 0}
					<div
						class="message"
						class:error={calculation.severity === 'error'}
						class:warning={calculation.severity === 'warning'}
						class:info={calculation.severity === 'info'}
					>
						{#each calculation.messages as message}
							<div>{message}</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
	<div class="disclaimer">
		by Stephan Troyer, powered by <a
			href="https://github.com/Qalculate/libqalculate">libqalculate</a
		>
	</div>
</div>

{@html '<scr' + 'ipt src="/calc.js"></script>'}

<style>
	.content {
		width: 90vw;
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
	}
	.query::placeholder {
		color: #dee;
		opacity: 0.5;
		text-align: center;
	}

	.responses {
		flex: 1;
		overflow: auto;
		margin: 20px auto 0;
		width: 100%;
		max-width: 750px;
	}

	.responses > div {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		padding: 5px 10px;
		text-align: left;
		cursor: pointer;
		overflow: hidden;
	}

	.responses > div + div {
		margin-top: 10px;
	}

	.message {
		margin: 10px 0 5px;
		font-size: 0.8em;
		opacity: 0.8;
		hyphens: auto;
	}

	.error {
		color: lightsalmon;
	}

	.warning {
		color: orange;
	}

	.info {
		opacity: 0.8;
	}

	.input {
		opacity: 0.85;
		padding-left: 25px;
	}

	.input::before {
		content: '>';
		position: absolute;
		opacity: 0.4;
		margin-left: -25px;
	}

	.output {
		margin: 20px 40px;
		font-size: 1.1em;
	}

	.disclaimer {
		font-size: 0.75em;
		opacity: 0.5;
		margin: 5px 10px;
	}
</style>
