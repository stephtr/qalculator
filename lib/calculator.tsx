'use client';

import { use, useState } from 'react';
import loadLibqalculate from 'libqalculate-wasm';
import { Chart } from 'react-chartjs-2';
import 'chart.js/auto';
import { Chart as ChartJS, Colors } from 'chart.js';

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
    locateFile: function (path: string, prefix: string) {
        if (path.endsWith('.wasm')) {
            return '/' + path;  // Absolute URL
        }
        return prefix + path;
    }
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
    const libqalculate = use(libqalculatePromise);

    // if (libqalculate == null) return null;
    const calculation = input ? libqalculate?.calculate(input, 0, 0) : null;
    const plotDataset = calculation?.plotData ? processPlotData(calculation.plotData) : null;
    return <div>
        <input title="Calculation" className="border-white border-2" style={{ border: '2px solid white' }} value={input} onChange={(e) => setInput(e.currentTarget.value)} />
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