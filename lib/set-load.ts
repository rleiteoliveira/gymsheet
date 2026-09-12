export function formatSetLoad(kg: number | null | undefined, reps: number): string {
    const hasKg = kg !== null && kg !== undefined;
    const hasReps = Number.isFinite(reps) && reps > 0;
    const kgLabel = hasKg
        ? `${kg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`
        : '';
    if (hasKg && hasReps) return `${kgLabel} · ${reps} reps`;
    if (hasKg) return kgLabel;
    if (hasReps) return `${reps} reps`;
    return '';
}
