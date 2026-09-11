# Design QA — registro mínimo do treino livre

## Target and implementation

- Source visual truth: `C:/Users/rafao/AppData/Local/Temp/codex-clipboard-09133d02-79b6-4edc-ae60-1cf2395172f9.png`
- Implementation screenshot: `output/playwright/essential-quick-minimal.png`
- Post-action screenshot: `output/playwright/essential-quick-after-first-series.png`
- Viewport: 745 × 985 CSS px; device scale factor 1.
- Source pixels: 745 × 1186. The source is the dense pre-change state, so its greater height is expected rather than a viewport mismatch.
- Implementation pixels: 745 × 985 for both captures. The simplified initial state fits without scrolling.
- State: treino livre em andamento, antes da primeira série; comparison follow-up after the first marked series.

## Comparison

Full-view comparison confirms that the implementation keeps the existing dark companion surface, date context, workout timer, exercise index/name, series count, and primary action while removing the dense editor controls visible in the source: editable workout name, editable exercise combobox, muscle-group chips, catalog suggestions, and weight/repetition fields.

Focused region comparison of the active exercise confirms that the initial state exposes only `Marcar série`. The post-action capture shows the recorded blank series and reveals `Próximo exercício` only after the first mark. No new imagery or non-standard visual asset was introduced.

Required fidelity surfaces:

- Fonts and typography: existing GymSheet system font, weight hierarchy, and compact labels are preserved; the primary action remains legible at the mobile width.
- Spacing and layout rhythm: the active exercise now has one clear action and the next-exercise control enters below the recorded series without collapsing the session footer.
- Colors and visual tokens: existing dark background, muted metadata, line borders, primary light action, and secondary outline action are reused.
- Image quality and asset fidelity: the source and target contain no product imagery or custom image assets; no approximation was introduced.
- Copy and content: `Exercício 1`, `Marcar série`, `Próximo exercício`, `Finalizar`, and the existing date/timer language match the intended companion flow.

## Findings

- No actionable P0, P1, or P2 differences remain for the requested simplified flow.
- The header still shows the derived workout name as context, but it is no longer an input or a configuration surface.
- Planned/ficha sessions intentionally retain their existing editor and picker controls; this is outside the requested quick companion surface.

## Comparison history

1. Initial capture was taken during the arrival animation and did not show the content reliably. The capture was repeated after the 480 ms arrival transition at the same viewport; the final implementation screenshot is the stable post-animation evidence.
2. The stable comparison found no actionable P0/P1/P2 mismatch, so no further visual iteration was required.

## Primary interactions tested

- Open treino livre without an intermediate picker.
- Confirm no session-name input, combobox, muscle filters, catalog suggestions, or weight/repetition inputs are rendered.
- Mark the first blank series.
- Confirm `Próximo exercício` is absent before the first mark and visible after it.
- Preserve the planned/ficha flow in the full E2E suite.
- Console checked in the in-app browser; no error or warning entries were returned.

## Implementation Checklist

- [x] Remove configuration controls from the quick session surface.
- [x] Keep blank series registration as the primary action.
- [x] Gate the next-exercise action on the first recorded series.
- [x] Verify mobile-width captures and primary interactions.

## Follow-up Polish

- Future load/repetition suggestions remain intentionally deferred until usage data justifies them.

final result: passed
