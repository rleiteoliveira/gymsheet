export const SKIN_STORAGE_KEY = 'gymsheet-skin';

export const SKINS = ['calor', 'studio', 'pulse'] as const;

export type Skin = (typeof SKINS)[number];

export const SKIN_OPTIONS: { id: Skin; label: string }[] = [
    { id: 'calor', label: 'Calor' },
    { id: 'studio', label: 'Studio' },
    { id: 'pulse', label: 'Pulse' },
];

export function parseSkin(value: string | null | undefined): Skin {
    return SKINS.find((skin) => skin === value) ?? 'calor';
}

export function setCountCopy(done: number, target: number | null | undefined) {
    const count = Number.isFinite(done) ? Math.max(0, Math.floor(done)) : 0;
    const goal = Number.isFinite(target) ? Math.max(0, Math.floor(target ?? 0)) : 0;
    if (goal > 0) {
        const label = `${count} de ${goal} séries`;
        return { count: String(count), label, accessibleName: label };
    }
    return {
        count: String(count),
        label: count === 1 ? 'série' : 'séries',
        accessibleName: count === 1 ? '1 série registrada' : `${count} séries registradas`,
    };
}
