'use client';

import { use, useState } from 'react';
import loadLibqalculate from 'libqalculate-wasm';
import { Chart } from 'react-chartjs-2';
import 'chart.js/auto';
import { Chart as ChartJS, Colors } from 'chart.js';
import { MathInput } from './MathInput';

import { convertLatexToAsciiMath, convertAsciiMathToLatex } from 'mathlive/ssr';

const activeZoomPlugin = false;

if (typeof window !== 'undefined') {
    if (activeZoomPlugin) {
        // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
        const zoomPlugin = require('chartjs-plugin-zoom').default;
        ChartJS.register(zoomPlugin);
    }
    ChartJS.register(Colors);
}

const libqalculatePromise = typeof window !== 'undefined' ? loadLibqalculate({
    locateFile: (path: string) => `/${path}`, // Absolute URL
}) : Promise.resolve(null);

function processPlotData({ commands: commandsString, data }: { commands: string; data: Record<string, string> }) {
    const commands = commandsString.split('\n');
    const plotCommandRegExp = /(plot |,)"([^"]+)"\s+title\s+"([^"]+)"/g;
    const plotCommand = commands.find(s => s.startsWith('plot '));
    if (!plotCommand) return null;
    const matches = Array.from(plotCommand.matchAll(plotCommandRegExp));
    return {
        datasets: matches.map(([, , id, title]) => {
            return {
                data: data[id].slice(0, -1).split('\n').map(l => {
                    const [x, y] = l.split(' ').map(Number.parseFloat);
                    return { x, y };
                }),
                label: title,
            }
        })
    };
}

export function Calculator() {
    const [input, setInput] = useState('');
    const [latexInput, setLatexInput] = useState('');
    const libqalculate = use(libqalculatePromise);

    const calculation = input ? libqalculate?.calculate(input, 0, 0) : null;
    const plotDataset = calculation?.plotData ? processPlotData(calculation.plotData) : null;
    return <div>
        <MathInput
            onInput={evt => { setLatexInput(evt.currentTarget.value); setInput(convertLatexToAsciiMath(evt.currentTarget.value)) }}
            disableLatexMode
            removeExtraneousParentheses
            className="min-w-80 border-gray-400 border-2 mb-2"
        >
            {latexInput}
        </MathInput>
        <div><input title="Calculation" className="border-gray-600 border-2" value={input} onChange={(e) => { setInput(e.currentTarget.value); setLatexInput(convertAsciiMathToLatex(e.currentTarget.value)); }} /></div>
        {calculation && !plotDataset && <div><span dangerouslySetInnerHTML={{ __html: calculation.input }} /> = <span dangerouslySetInnerHTML={{ __html: calculation.output }} /></div>}
        {plotDataset && (
            <Chart
                type="line"
                data={plotDataset}
                options={{
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: {
                                display: true,
                                text: 'X Axis'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Y Axis'
                            }
                        }
                    },
                    plugins: {
                        colors: {
                            forceOverride: true
                        },
                        ...{
                            zoom: {
                                pan: {
                                    enabled: true,
                                    mode: 'x',
                                    // onPan: onPanOrZoom,
                                },
                                zoom: {
                                    wheel: {
                                        enabled: true,
                                    },
                                    mode: 'x',
                                    // onZoom: onPanOrZoom,
                                },
                                limits: {
                                    x: {
                                        min: plotDataset.datasets[0].data[0].x,
                                        max: plotDataset.datasets[0].data[plotDataset.datasets[0].data.length - 1].x,
                                    },
                                },
                            }
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any
                    },
                }}
                width={600}
                height={600}
            />
        )}
    </div>;
}