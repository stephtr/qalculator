<script lang="ts">
	import { slide } from 'svelte/transition';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faBookmark,
		faTrash,
		faICursor,
	} from '@fortawesome/free-solid-svg-icons';
	import type { Calculation } from './calculator';
	import type { History } from './history';

	export let calculation: Calculation;
	export let history: History;
	export let onselectcalculation: (input: string) => void;
	/** this event triggers on the onMouseDownEvent */
	export let onabouttoselect: () => void;

	function bookMarkClick(calculation: Calculation) {
		if (calculation.isBookmarked) {
			history.removeBookmark(calculation.id);
		} else {
			history.bookmark(calculation.id);
		}
	}

	function renameClick(calculation: Calculation) {
		const name = prompt(
			'Enter a name for the calculation:',
			calculation.bookmarkName,
		);
		history.renameBookmark(calculation.id, name ?? undefined);
	}
</script>

<div class="responseHost">
	<div class="swipeRightContainer">Hello</div>
	<button
		on:mousedown={() => onabouttoselect()}
		on:click={() => onselectcalculation(calculation.rawInput)}
		transition:slide
		class="response"
	>
		{#if calculation.bookmarkName}
			<div class="name">
				<FontAwesomeIcon icon={faBookmark} />
				{calculation.bookmarkName}
			</div>
		{/if}
		<div>
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
	</button>
	<div class="mouseActions">
		<button
			title="Remove"
			class="deleteButton"
			on:click={() => history.delete(calculation.id)}
		>
			<FontAwesomeIcon icon={faTrash} />
		</button>
		{#if calculation.isBookmarked}
			<button
				title="Rename"
				class="renameButton"
				on:click={() => renameClick(calculation)}
			>
				<FontAwesomeIcon icon={faICursor} />
			</button>
		{/if}
		<button
			title={calculation.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
			class="bookmarkButton"
			class:active={calculation.isBookmarked}
			on:click={() => bookMarkClick(calculation)}
		>
			<FontAwesomeIcon icon={faBookmark} />
		</button>
	</div>
	<div class="swipeLeftContainer">Hello</div>
</div>

<style>
	.response {
		background: #2a3030;
		border-radius: 10px;
		padding: 5px 10px;
		text-align: left;
		cursor: pointer;
		overflow: hidden;
		position: relative;
		display: block;
		width: 100%;
		border: none;
		color: inherit;
		margin-bottom: 10px;
		z-index: 2;
	}

	.responseHost {
		position: relative;
	}

	.swipeRightContainer {
		position: absolute;
		z-index: 1;
	}

	.swipeLeftContainer {
		position: absolute;
	}

	.mouseActions {
		position: absolute;
		right: 0;
		bottom: 0;
		padding-left: 10px;
		cursor: default;
		z-index: 3;
	}

	.mouseActions button {
		width: 40px;
		height: 40px;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		color: #788;
		opacity: 0.3;
		transition: opacity 0.1s;
	}

	@media (hover: hover) {
		.mouseActions button {
			opacity: 0;
		}
	}

	.responseHost:hover .mouseActions button {
		opacity: 1;
	}

	.mouseActions button.active,
	.mouseActions button:focus:focus-visible {
		opacity: 0.5;
	}

	.mouseActions button:last-child {
		border-bottom-right-radius: 10px;
	}

	.deleteButton:hover {
		color: red;
	}

	.renameButton:hover {
		color: lightgreen;
	}

	.bookmarkButton:hover {
		color: orange;
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

	.name {
		margin-bottom: 5px;
		color: #9aa;
		font-size: 0.9em;
	}

	.name :global(svg) {
		opacity: 0.6;
		margin-right: 7px;
		transform-origin: top left;
		transform: translateY(-10px) scale(1.5);
	}
</style>
