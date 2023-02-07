import { History } from './history';
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

/** Parses the status message coming from Web Assembly */
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
	history = new History();

	#isLoaded = false;

	get isLoaded() {
		return this.#isLoaded;
	}

	private loadedListeners: Array<() => void> = [];

	/** adds a callback which gets executed when qalculator has finished loading */
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

	/** adds a callback which gets executed whenever a calculation is submitted */
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
				// parse the variables supported by libqalculate
				M.variables = wasmVectorToArray(M.getVariables())
					.map((v: any) => ({
						name: v.name as string,
						description: v.description as string,
						aliases: (v.aliases as string).split('\t'),
					}))
					.filter(
						(v) => !['true', 'false', 'undefined'].includes(v.name),
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
					// It takes a bit longer for the `calculate` routine to be ready than
					// for the wasm module itself to load. Let's therefore wait for everything
					// to be ready.
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