/// <reference types="@sveltejs/kit" />

declare namespace Module {
	const calculate: (
		calculation: string,
		timeoutMs: number,
	) => {
		input: string;
		output: string;
		messages: string;
		delete: () => void;
	};

	const variables: { name: string; description: string; aliases: string[] }[];
}
