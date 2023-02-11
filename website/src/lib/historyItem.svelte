<script lang="ts">
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

	function deleteClick() {
		history.delete(calculation.id);
	}

	function bookMarkClick() {
		if (calculation.isBookmarked) {
			history.removeBookmark(calculation.id);
		} else {
			history.bookmark(calculation.id);
		}
	}

	function renameClick() {
		const name = prompt(
			'Enter a name for the calculation:',
			calculation.bookmarkName,
		);
		history.renameBookmark(calculation.id, name ?? undefined);
	}

	function getMeanXPos(list: TouchList) {
		const touches: Touch[] = [].slice.call(list);
		return touches.reduce((v, t) => v + t.screenX, 0) / touches.length;
	}

	function getMeanYPos(list: TouchList) {
		const touches: Touch[] = [].slice.call(list);
		return touches.reduce((v, t) => v + t.screenY, 0) / touches.length;
	}

	let startX: number | undefined = undefined;
	let startY: number | undefined = undefined;
	let offsetX: number = 0;
	let offsetY: number = 0;
	let shiftX: number = 0;
	const swipeButtonSize = 100;
	function touchstart(evt: TouchEvent) {
		startX = getMeanXPos(evt.targetTouches) - offsetX;
		startY = getMeanYPos(evt.targetTouches) - offsetY;
	}

	let deleteSwipeSelected = false;
	let bookmarkSwipeSelected = false;
	let renameSwipeSelected = false;
	function touchmove(evt: TouchEvent) {
		if (startX === undefined || startY === undefined) return;
		offsetX = getMeanXPos(evt.targetTouches) - startX;
		offsetY = getMeanYPos(evt.targetTouches) - startY;
		if (Math.abs(offsetY) > Math.abs(offsetX)) {
			shiftX = 0;
		} else {
			const direction = Math.sign(offsetX);
			const abs = Math.abs(offsetX);
			let swipeSize = swipeButtonSize;
			if (calculation.isBookmarked && direction < 0) {
				swipeSize = 2 * swipeButtonSize;
			}
			if (abs < swipeSize - swipeButtonSize) {
				shiftX = offsetX;
			} else {
				shiftX =
					direction *
					(swipeSize -
						swipeButtonSize +
						(1 -
							Math.exp(
								-(abs - swipeSize + swipeButtonSize) /
									swipeSize,
							)) *
							swipeButtonSize);
			}
		}

		deleteSwipeSelected = shiftX > swipeButtonSize / 2;
		renameSwipeSelected = shiftX < (-swipeButtonSize * 3) / 2;
		bookmarkSwipeSelected =
			shiftX < -swipeButtonSize / 2 && !renameSwipeSelected;
	}

	function touchend(evt: TouchEvent) {
		if (evt.targetTouches.length > 0) return;
		if (deleteSwipeSelected) {
			deleteSwipeSelected = false;
			deleteClick();
		}
		if (bookmarkSwipeSelected) {
			bookmarkSwipeSelected = false;
			bookMarkClick();
		}
		if (renameSwipeSelected) {
			renameSwipeSelected = false;
			renameClick();
		}
		shiftX = 0;
		offsetX = 0;
		offsetY = 0;
	}

	function touchcancel(evt: TouchEvent) {
		shiftX = 0;
		offsetX = 0;
		offsetY = 0;
		console.log('cancelled');
	}
</script>

<div class="responseHost">
	<button
		class="response"
		on:mousedown={() => onabouttoselect()}
		on:click={() => onselectcalculation(calculation.rawInput)}
		style={`transform: translateX(${shiftX}px)`}
		on:touchstart={touchstart}
		on:touchmove={touchmove}
		on:touchend={touchend}
		on:touchcancel={touchcancel}
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
	<div class="mouseActions" style={`transform: translateX(${shiftX}px)`}>
		<button title="Remove" class="deleteButton" on:click={deleteClick}>
			<FontAwesomeIcon icon={faTrash} />
		</button>
		{#if calculation.isBookmarked}
			<button title="Rename" class="renameButton" on:click={renameClick}>
				<FontAwesomeIcon icon={faICursor} />
			</button>
		{/if}
		<button
			title={calculation.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
			class="bookmarkButton"
			class:active={calculation.isBookmarked}
			on:click={bookMarkClick}
		>
			<FontAwesomeIcon icon={faBookmark} />
		</button>
	</div>
	<div class="swipeContainer left">
		<div class="swipeAction delete" class:selected={deleteSwipeSelected}>
			<FontAwesomeIcon icon={faTrash} />
		</div>
	</div>
	<div class="swipeContainer right">
		{#if calculation.isBookmarked}
			<div
				class="swipeAction rename"
				class:selected={renameSwipeSelected}
			>
				<FontAwesomeIcon icon={faICursor} />
			</div>
		{/if}
		<div
			class="swipeAction bookmark"
			class:selected={bookmarkSwipeSelected}
		>
			<FontAwesomeIcon icon={faBookmark} />
		</div>
	</div>
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
		will-change: transform;
	}

	.responseHost {
		position: relative;
		overflow: hidden;
		touch-action: pan-y;
	}

	.swipeContainer {
		position: absolute;
		top: 1px;
		bottom: 11px;
		overflow: hidden;
		display: flex;
	}

	.swipeContainer.left {
		border-radius: 10px 0 0 10px;
		left: 1px;
	}

	.swipeContainer.right {
		border-radius: 0 10px 10px 0;
		right: 1px;
	}

	.swipeAction {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100px;
		font-size: 1.5em;
		color: rgba(255, 255, 255, 0.5);
	}

	.swipeAction :global(svg) {
		transition: transform 0.2s;
	}

	.swipeAction.selected {
		color: white;
	}

	.swipeAction.selected :global(svg) {
		transform: scale(1.2);
	}

	.swipeAction.delete {
		background: red;
	}

	.swipeAction.bookmark {
		background: orange;
	}

	.swipeAction.rename {
		background: lightgreen;
	}

	.mouseActions {
		position: absolute;
		right: 0;
		bottom: 10px;
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

	@media (hover: none) {
		.mouseActions button:not(.active) {
			display: none;
		}
	}

	:global(.isTouchScreen) .mouseActions button:not(.active) {
		display: none;
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
