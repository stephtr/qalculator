'use client';

import type { MathfieldElement } from 'mathlive';
import { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';

if (typeof window !== 'undefined') {
    (async () => {
        const { MathfieldElement: _MathfieldElement } = await import('mathlive');
        _MathfieldElement.fontsDirectory = "/mathlive-fonts";
    })();
}

export function MathInput({ disableLatexMode = false, onKeyDown, children, removeExtraneousParentheses = false, ...props }: React.HTMLAttributes<MathfieldElement> & { disableLatexMode?: boolean, removeExtraneousParentheses?: boolean, placeholder?: string }) {
    const [isShown, setIsShown] = useState(false);
    useEffect(() => setIsShown(true), []);

    const ref = useRef<MathfieldElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        ref.current.removeExtraneousParentheses = removeExtraneousParentheses;
        ref.current.inlineShortcuts = {
            ...ref.current.inlineShortcuts,
            plot: '\\operatorname{plot}'
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref.current, removeExtraneousParentheses]);

    const onKeyDownHandler = useCallback((ev: KeyboardEvent<MathfieldElement>) => {
        if (disableLatexMode) {
            if (ev.key === '\\') {
                ev.preventDefault();
                ev.currentTarget.executeCommand(['insert', '\\backslash']);
            } else if (ev.key === 'Escape') ev.preventDefault();
        }
        if (ev.key === 'Dead') {
            // this temporarily fixes an issue with "^" on macOS/Edge
            ev.preventDefault();
        }
        if (onKeyDown) onKeyDown(ev);
    }, [disableLatexMode, onKeyDown]);

    if (!isShown) return null;
    return (
        <math-field
            ref={ref}
            onKeyDownCapture={onKeyDownHandler}
            mathModeSpace="\:"
            feedback={false}
            {...props}
        >
            {children}
        </math-field>
    );
}