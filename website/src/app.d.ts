/// <reference types="@sveltejs/kit" />

declare namespace Module {
	const calculate: (calculation: string) => {
		input: string;
		output: string;
		messages: string;
		delete: () => void;
	};
}
