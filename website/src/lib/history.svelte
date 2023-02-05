<script lang="ts">
	import { slide } from 'svelte/transition';
	import { type Calculation, CalculationHistory } from '../calculation';
	import { getOS } from '../tools';

	export let calculations: Calculation[];
	export let showLoadingIndicator: boolean;
	export let onclearhistory: () => void;
	export let onselectcalculation: (input: string) => void;

	const isDesktopOS = ['win', 'linux', 'mac'].includes(getOS());
</script>

<div class="responses">
	{#if showLoadingIndicator}
		<div transition:slide>
			<div class="loading"><span /></div>
		</div>
	{/if}
	{#each calculations as calculation (calculation.id)}
		<div
			on:click={() => onselectcalculation(calculation.rawInput)}
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
	{#if isDesktopOS}
		<div class="calloutQalculate">
			<a href="https://qalculate.github.io/">
				<img src="/qalculate.svg" width="64" height="64" alt="" />
			</a>
			<div>
				Looking for a fully fledged calculator for PC/Mac?<br />
				<small>
					Give
					<a href="https://qalculate.github.io/">Qalculate!</a>
					a try!
				</small>
			</div>
		</div>
	{/if}
	{#if CalculationHistory.hasEntries(calculations)}
		<button class="clearHistoryButton" on:click={onclearhistory}>
			Clear history
		</button>
	{/if}
</div>

<style>
	.loading {
		display: block;
		margin: 10px auto;
		height: 40px;
		width: 40px;
	}

	.loading::before,
	.loading::after,
	.loading > span {
		content: '';
		display: block;
		position: absolute;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background-color: #899;
		opacity: 0.5;
		animation: bounce 2s infinite ease-in-out;
	}

	.loading > span {
		animation-delay: -1.33s;
	}

	.loading::after {
		animation-delay: -0.66s;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: scale(0);
		}
		50% {
			transform: scale(1);
		}
	}

	.responses {
		flex: 1;
		overflow: auto;
		margin: 10px auto 0;
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
		-webkit-hyphens: auto;
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

	.output {
		margin: 20px 40px;
		font-size: 1.1em;
	}

	.calloutQalculate.calloutQalculate {
		display: flex;
		align-items: center;
		line-height: 1.3;
		font-size: 1.1rem;
		cursor: default;
	}

	.calloutQalculate img {
		display: block;
		margin: 0 15px 0 -5px;
	}

	.calloutQalculate small {
		font-size: 1rem;
		opacity: 0.85;
	}

	.clearHistoryButton {
		display: block;
		background: none;
		font: inherit;
		color: inherit;
		border: none;
		font-size: 0.9rem;
		opacity: 0.5;
		text-decoration: underline;
		cursor: pointer;
		margin: 5px auto;
	}
</style>
