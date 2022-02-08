type Severity = 'error' | 'warning' | 'info';

export interface Calculation {
	id: string;
	input: string;
	rawInput: string;
	output: string;
	messages: string[];
	severity?: Severity;
}

export function parseMessages(
	messagesString: string,
): [messages: string[], severity?: Severity] {
	const messages = messagesString.split('\n');
	const severity = messages.find((m) => m.startsWith('Error'))
		? 'error'
		: messages.find((m) => m.startsWith('Warning'))
		? 'warning'
		: messages.length > 0
		? 'info'
		: null;
	return [
		messages.map((m) => m.replace(/^(Error|Warning|Info): /, '')),
		severity,
	];
}

export const tutorialCalculations: Calculation[] = [
	{
		id: 'tut3',
		input: 'sqrt(<span style="color:#FFFFAA">pi</span>^<span style="color:#AAFFFF">2</span>)',
		rawInput: 'sqrt(pi^2)',
		output: '<span style="color:#FFFFAA">π</span> ≈ <span style="color:#AAFFFF">3,1415927</span>',
		messages: [],
		severity: null,
	},
	{
		id: 'tut2',
		input: '<span style="color:#AAFFFF">1</span> <span style="color:#BBFFBB">kg</span> + <span style="color:#AAFFFF">1</span> <span style="color:#BBFFBB">g</span>',
		rawInput: '1kg + 1g',
		output: '<span style="color:#AAFFFF">1,001</span> <span style="color:#BBFFBB">kg</span>',
		messages: [],
		severity: null,
	},
	{
		id: 'tut1',
		input: '<span style="color:#AAFFFF">1</span> + <span style="color:#AAFFFF">1</span>',
		rawInput: '1 + 1',
		output: '<span style="color:#AAFFFF">2</span>',
		messages: [],
		severity: null,
	},
];
