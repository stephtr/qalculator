/* eslint-disable no-bitwise */
import { delay, wasmVectorToArray } from './tools';

export enum CalculationOptions {
	None = 0,
	NoUnits = 1 << 0,
	DecimalPoint = 1 << 1,
}

export interface CalculationResult {
	input: string;
	output: string;
	messages: string;
}

export interface VariableDefinition {
	name: string;
	description: string;
	aliases: string[];
}

let Version: number | undefined;
export function version(): number {
	if (!Version) Version = Module.version?.() ?? 1;
	return Version!;
}

export function calculate(
	calculation: string,
	timeoutMs: number,
	options: CalculationOptions,
) {
	let result: CalculationResult & { delete: () => void };
	if (version() < 2) {
		result = Module.calculate(calculation, timeoutMs);
	} else {
		result = Module.calculate(calculation, timeoutMs, options);
	}
	const ret: CalculationResult = {
		input: result.input,
		output: result.output,
		messages: result.messages,
	};
	result.delete();
	return ret;
}

export function setOption(option: string): boolean {
	if (version() < 3) return false;
	return Module.set_option(option);
}

export function info(): string {
	return Module.info();
}

let Variables: VariableDefinition[] = [];
export const getVariables = () => Variables;

function getLoadingState(): Promise<void> {
	if (Module?.calculate) return Promise.resolve();
	return new Promise((resolve) => {
		const onLoaded = async () => {
			// It takes a bit longer for the `calculate` routine to be ready than
			// for the wasm module itself to load. Let's therefore wait for everything
			// to be ready.
			while (!Module.calculate) {
				// eslint-disable-next-line no-await-in-loop
				await delay(250);
			}
			resolve();
		};
		if ((window as any).Module) {
			(window as any).Module.preRun = onLoaded;
		} else {
			(window as any).Module = {
				preRun: onLoaded,
			};
		}
	});
}

let initialized = false;
export async function initializeCalculationModule() {
	if (initialized) return Promise.resolve();
	initialized = true;

	await getLoadingState();

	if (Module.getVariables) {
		// parse the variables supported by libqalculate
		const vars = Module.getVariables();
		Variables = wasmVectorToArray(vars)
			.map((v: any) => ({
				name: v.name as string,
				description: v.description as string,
				aliases: (v.aliases as string).split('\t'),
			}))
			.filter((v) => !['true', 'false', 'undefined'].includes(v.name));
		vars.delete();
	}
}
