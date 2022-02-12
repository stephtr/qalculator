/// <reference types="@sveltejs/kit" />

declare namespace Module {
	const calculate: (calculation: string, timeoutMs: int) => {
		input: string;
		output: string;
		messages: string;
		delete: () => void;
	};
}
