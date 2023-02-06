import { CalculationHistory } from './calculationHistory';
import { delay, wasmVectorToArray } from './tools';

type Severity = 'error' | 'warning' | 'info';

export interface Calculation {
	id: string;
	input: string;
	rawInput: string;
	output: string;
	messages: string[];
	severity: Severity | null;
}

function parseCalculationMessages(messagesString: string): {
	messages: string[];
	severity: Severity | null;
} {
	const messages = messagesString.split('\n');
	let severity: Severity | null = null;
	if (messages.find((m) => m.startsWith('Error'))) {
		severity = 'error';
	} else if (messages.find((m) => m.startsWith('Warning'))) {
		severity = 'warning';
	} else if (messages.length > 0) {
		severity = 'info';
	}
	return {
		messages: messages.map((m) => m.replace(/^(Error|Warning|Info): /, '')),
		severity,
	};
}

export class Calculator {
	history = new CalculationHistory();

	#isLoaded = false;

	get isLoaded() {
		return this.#isLoaded;
	}

	private loadedListeners: Array<() => void> = [];

	addOnLoadedListener(listener: () => void) {
		if (this.isLoaded) {
			listener();
			return;
		}
		this.loadedListeners.push(listener);
	}

	removeOnLoadedListener(listener: () => void) {
		this.loadedListeners = this.loadedListeners.filter(
			(l) => l !== listener,
		);
	}

	private submittedListeners: Array<(calculation: string) => void> = [];

	addOnCalculationListener(listener: (calculation: string) => void) {
		this.submittedListeners.push(listener);
	}

	removeOnCalculationListener(listener: (calculation: string) => void) {
		this.submittedListeners = this.submittedListeners.filter(
			(l) => l !== listener,
		);
	}

	calculate(textInput: string, timeoutMs: number = 500): Calculation {
		const calculation = Module.calculate(textInput, timeoutMs);
		let { messages, severity } = parseCalculationMessages(
			calculation.messages,
		);
		let { input, output } = calculation;
		if (output === 'timed out') {
			messages = ['Calculation timed out'];
			severity = 'error';
			output = '';
		}
		calculation.delete();
		return {
			id: Math.random().toString(),
			input,
			rawInput: textInput,
			output,
			messages,
			severity,
		};
	}

	private pendingCalculationOnceLoaded: string | null = null;

	submitCalculation(input: string) {
		this.submittedListeners.forEach((l) => l(input));
		if (!this.isLoaded) {
			this.pendingCalculationOnceLoaded = input;
			return;
		}
		this.history.add(this.calculate(input));
	}

	constructor() {
		this.addOnLoadedListener(() => {
			const M = Module as any;
			if (M.getVariables) {
				M.variables = wasmVectorToArray(M.getVariables()).map(
					(v: any) => ({
						name: v.name,
						description: v.description,
						aliases: v.aliases.split('\t'),
					}),
				);
			}

			this.#isLoaded = true;

			if (this.pendingCalculationOnceLoaded) {
				this.submitCalculation(this.pendingCalculationOnceLoaded);
				this.pendingCalculationOnceLoaded = null;
			}
		});

		if (typeof window !== 'undefined') {
			const notifyLoaded = () => this.loadedListeners.forEach((l) => l());
			if (window.Module?.calculate as any) {
				notifyLoaded();
			} else {
				const onLoaded = async () => {
					while (!Module.calculate) {
						// eslint-disable-next-line no-await-in-loop
						await delay(250);
					}
					notifyLoaded();
				};
				if (window.Module) {
					(window as any).Module.preRun = onLoaded;
				} else {
					(window as any).Module = {
						preRun: onLoaded,
					};
				}
			}
		}
	}
}
