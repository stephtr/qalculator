'use client';

import { useEffect, useState, KeyboardEvent, use } from 'react';
import loadLibqalculate from 'libqalculate-wasm';
import * as Y from 'yjs';
import YPartyKitProvider from "y-partykit/provider";

const libqalculatePromise = typeof window !== 'undefined' ? loadLibqalculate({
    locateFile: (path: string) => `/${path}`, // Absolute URL
}) : Promise.resolve(null);

const partykitUrl = process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:1999' : 'https://realtime.qalculator.xyz';

interface Cell {
    id: string;
    input: string;
    output: string;
}

export default function CalculationSheetPage() {
    const [ydoc] = useState(new Y.Doc());
    const [cells, setCells] = useState<Cell[]>([]);
    const libqalculate = use(libqalculatePromise);

    useEffect(() => {
        const provider = new YPartyKitProvider(partykitUrl, 'sheet', ydoc);
        provider.connect();


        const cellsArray = ydoc.getArray<Cell>('cells');
        function updateCells() {
            setCells(cellsArray.toArray());
        }
        cellsArray.observe(updateCells);
        updateCells();
        if (cellsArray.length === 0) {
            cellsArray.push([{ id: Math.random().toString(), input: '', output: '' }]);
        }

        return () => {
            cellsArray.unobserve(updateCells);
            provider.disconnect();
            ydoc.destroy();
        }
    }, [ydoc]);

    const handleInputChange = (id: string, newValue: string) => {
        const cellsArray = ydoc.getArray<Cell>('cells');

        const index = cells.findIndex(cell => cell.id === id);

        if (index === -1) throw new Error('Cell not found');
        const updatedCell = { ...cells[index], input: newValue };

        if (libqalculate) {
            const result = libqalculate.calculate(newValue, 100, 0);
            updatedCell.output = result.output;
        }

        cellsArray.delete(index);
        cellsArray.insert(index, [updatedCell]);
    };

    const handleKeyUp = (id: string, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const cellsArray = ydoc.getArray<Cell>('cells');
            const index = cells.findIndex(cell => cell.id === id);
            if (index === -1) throw new Error('Cell not found');
            cellsArray.insert(index + 1, [{ id: Math.random().toString(), input: '', output: '' }]);
        }
        if (e.key === 'Backspace' && e.currentTarget.value === '') {
            const cellsArray = ydoc.getArray<Cell>('cells');
            const index = cells.findIndex(cell => cell.id === id);
            if (index === -1) throw new Error('Cell not found');
            cellsArray.delete(index);
        }
    }

    return <div className="p-4">
        <h2>Warning: this sheet is shared across all users worldwide :D</h2>
        {cells.map(cell => {
            return <div key={cell.id} className="mt-2">
                <input title="Rechnung" type="text" className="border-2 border-gray-700 px-2" value={cell.input} onChange={(e) => handleInputChange(cell.id, e.currentTarget.value)} onKeyUp={(e) => handleKeyUp(cell.id, e)} /> = <span dangerouslySetInnerHTML={{ __html: cell.output }} />
            </div>;
        })}
    </div>;
}