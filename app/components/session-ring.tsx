import { sessionRingView, type SessionRingInput } from '@/lib/session-ring';

export function SessionRing(input: SessionRingInput) {
    const view = sessionRingView(input);
    return (
        <div
            className="essential-session-ring"
            data-testid="session-ring"
            data-kind={input.kind}
            data-complete={view.complete ? 'true' : undefined}
            aria-hidden="true"
        >
            <svg viewBox="0 0 36 36">
                <circle className="essential-session-ring-track" cx="18" cy="18" r="14" fill="none" pathLength="100" />
                <circle
                    className="essential-session-ring-value"
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    pathLength="100"
                    strokeDasharray={`${view.ratio * 100} 100`}
                />
            </svg>
            <span>{view.label}</span>
        </div>
    );
}
