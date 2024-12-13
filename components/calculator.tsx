"use client";

import loadLibqalculate from "libqalculate-wasm";
import { use, useState } from "react";
import { Chart } from "react-chartjs-2";
import "chart.js/auto";
import { Chart as ChartJS, Colors } from "chart.js";
import { MathInput } from "./MathInput";

import { convertAsciiMathToLatex, convertLatexToAsciiMath } from "mathlive/ssr";

const activeZoomPlugin = false;

if (typeof window !== "undefined") {
	if (activeZoomPlugin) {
		const zoomPlugin = require("chartjs-plugin-zoom").default;
		ChartJS.register(zoomPlugin);
	}
	ChartJS.register(Colors);
}

const libqalculatePromise =
	typeof window !== "undefined"
		? loadLibqalculate({
				locateFile: (path: string) => `/${path}`, // Absolute URL
			})
		: Promise.resolve(null);

function processPlotData({
	commands: commandsString,
	data,
}: { commands: string; data: Record<string, string> }) {
	const commands = commandsString.split("\n");
	const plotCommandRegExp = /(plot |,)"([^"]+)"\s+title\s+"([^"]+)"/g;
	const plotCommand = commands.find((s) => s.startsWith("plot "));
	if (!plotCommand) return null;
	const matches = Array.from(plotCommand.matchAll(plotCommandRegExp));
	return {
		datasets: matches.map(([, , id, title]) => {
			return {
				data: data[id]
					.slice(0, -1)
					.split("\n")
					.map((l) => {
						const [x, y] = l.split(" ").map(Number.parseFloat);
						return { x, y };
					}),
				label: title,
			};
		}),
	};
}

export function Calculator() {
	const [input, setInput] = useState("");
	const [latexInput, setLatexInput] = useState("");
	const [usingNewInput, setUsingNewInput] = useState(true);
	const libqalculate = use(libqalculatePromise);

	const calculation = input ? libqalculate?.calculate(input, 0, 0) : null;
	const plotDataset = calculation?.plotData
		? processPlotData(calculation.plotData)
		: null;
	return (
		<>
			<div className="text-right pr-5 -mt-8">
				<button
					type="button"
					className="bg-transparent border-none underline mb-1 text-base"
					onClick={() => setUsingNewInput(!usingNewInput)}
				>
					{usingNewInput ? "Switch to old input" : "Switch to new input"}
				</button>
			</div>
			<div className="mb-3">
				{usingNewInput && (
					<MathInput
						placeholder="\textrm{Your calculation}"
						onInput={(evt) => {
							setLatexInput(evt.currentTarget.value);
							setInput(convertLatexToAsciiMath(evt.currentTarget.value));
						}}
						disableLatexMode
						removeExtraneousParentheses
						className="w-full border-none rounded-3xl text-2xl relative cursor-text bg-[#344] text-[#eff] px-5 [&::part(content)]:min-h-12 [&::part(content)]:justify-center [&::part(menu-toggle)]:hidden [&::part(virtual-keyboard-toggle)]:absolute [&::part(virtual-keyboard-toggle)]:right-3"
					>
						{latexInput}
					</MathInput>
				)}
				{!usingNewInput && (
					<input
						title="Calculation"
						placeholder="Your calculation"
						className="w-full border-none rounded-3xl h-12 relative text-center bg-[#344] text-[#eff] px-5"
						value={input}
						onChange={(e) => {
							setInput(e.currentTarget.value);
							setLatexInput(convertAsciiMathToLatex(e.currentTarget.value));
						}}
					/>
				)}
			</div>
			{calculation && !plotDataset && (
				<div>
					={" "}
					{/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
					<span dangerouslySetInnerHTML={{ __html: calculation.output }} />
				</div>
			)}
			{plotDataset && (
				<Chart
					className="!h-[50vh] self-center max"
					type="line"
					data={plotDataset}
					options={{
						scales: {
							x: {
								type: "linear",
								position: "bottom",
								title: {
									display: true,
									text: "x",
								},
							},
							y: {
								title: {
									display: true,
								},
							},
						},
						plugins: {
							colors: {
								forceOverride: true,
							},
							...({
								zoom: {
									pan: {
										enabled: true,
										mode: "x",
										// onPan: onPanOrZoom,
									},
									zoom: {
										wheel: {
											enabled: true,
										},
										mode: "x",
										// onZoom: onPanOrZoom,
									},
									limits: {
										x: {
											min: plotDataset.datasets[0].data[0].x,
											max: plotDataset.datasets[0].data[
												plotDataset.datasets[0].data.length - 1
											].x,
										},
									},
								},
								// biome-ignore lint/suspicious/noExplicitAny: <explanation>
							} as any),
						},
					}}
				/>
			)}
		</>
	);
}
