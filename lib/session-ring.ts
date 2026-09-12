export const OPEN_RING_STEP = 0.12;
export const OPEN_RING_CAP = 0.92;

export type SessionRingInput =
    | { kind: 'planned'; done: number; target: number }
    | { kind: 'open'; done: number };

export interface SessionRingView {
    ratio: number;
    label: string;
    complete: boolean;
    accessibleName: string;
}

function wholeCount(value: number): number {
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function sessionRingView(input: SessionRingInput): SessionRingView {
    const done = wholeCount(input.done);
    if (input.kind === 'planned') {
        const target = wholeCount(input.target);
        if (target <= 0) return sessionRingView({ kind: 'open', done });
        const ratio = Math.min(1, done / target);
        const complete = done >= target;
        return {
            ratio,
            label: `${done}/${target}`,
            complete,
            accessibleName: complete ? `${done} de ${target} séries, meta atingida` : `${done} de ${target} séries`,
        };
    }

    const ratio = Math.min(OPEN_RING_CAP, done * OPEN_RING_STEP);
    return {
        ratio,
        label: String(done),
        complete: false,
        accessibleName: done === 1 ? '1 série registrada' : `${done} séries registradas`,
    };
}
