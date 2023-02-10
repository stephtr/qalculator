<div class="loading"><span /></div>

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
</style>
