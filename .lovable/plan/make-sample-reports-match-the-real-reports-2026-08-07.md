# Make sample reports match the real reports

I audited each sample in `src/data/sampleReports.ts` against the live report engines. The Mind samples are broadly honest; the Body samples and several area labels promise things the real reports do not produce.

## What doesn't match today

**Area labels invented for the sample (confirmed against the real domain lists)**

- IQ sample shows six bars including "Memory". The real IQ scale has five categories: Logic, Pattern, Spatial, Speed, Self-read. There is no Memory category.
- Brain Health sample shows Sleep, Movement, Nutrition, Mental activity, Stress load, Connection. The real check-in has seven areas: Memory & focus, Heart & body, Sleep & recovery, Movement, Hearing & vision, Mood & connection, Mental challenge. Nutrition and Stress load do not exist; two real areas are missing.
- Body IQ sample shows Strength and Consistency. The real seven areas are Daily energy, Movement & strength, Food & hydration, Rest & recovery, Physical resilience, Numbers you know, Stress load.
- Sleep sample shows Wind-down, Morning feel, Daytime energy. The real seven areas are How long you sleep, Falling asleep, Staying asleep, Timing & rhythm, Room & wind-down, Caffeine/alcohol & screens, How your days feel.
- Hidden Athlete sample shows five bars (endurance drive, repeatability, explosiveness, mobility, load tolerance) and leans on mobility as the limiter. The real scale reads three axes only: endurance, volume, structure. Mobility and explosiveness are not measured.
- Hidden Genius sample uses trait names ("Long-view thinking", "Learns by teaching", "Improvises fast", "Tolerates mess") and the archetype "The Strategist". The real trait labels are Openness, Discipline, Extraversion, Warmth, Sensitivity, Structure, Independence, Risk Appetite, People Focus, Systems Thinking, Creativity, Detail Focus, and the matching archetype is "The Strategic Operator".

**Visuals promised but not rendered**

Body IQ, Sleep and Hidden Athlete samples show a bar breakdown per area. Those three real reports render text sections only — no score dial, no per-area bars — even though the report shell already supports a hero visual and the dashboards for the same scales already build one.

**Sleep sample sets a score expectation problem in reverse**: it correctly says "no score", which matches the engine. Body IQ correctly has a headline score. No change needed there.

## What to change

1. Rewrite every sample's bars, highlight labels, archetype names and body copy so each one uses only real area names and real archetype names from the engines. Keep the illustrative values; only the labels and the sentences that reference them change.
2. Add the per-area hero visual to the three Body-category reports so the bar breakdown the samples advertise actually appears. Reuse the same hero the matching dashboards already build (score dial for Body IQ, status grid for Sleep, three axis dials for Hidden Athlete) by passing it into the report shell.
3. Trim `fullReportAdds` claims to what the base report delivers. The IQ line currently implies per-question worked examples and a time breakdown, which are paid add-ons, not part of the report.
4. Add a small check script that asserts every sample bar label and archetype name exists in the corresponding engine's label maps, so future samples cannot drift again.

## Technical notes

- Labels come from `BODY_DOMAIN_LABEL`, `SLEEP_DOMAIN_LABEL`, `DOMAIN_LABEL` (brain health), `TRAIT_LABEL` / `ARCHETYPES` (hidden genius), `ATHLETE_AXIS_LABEL`, and the `Category` union in `src/types/funnel.ts`.
- The hero slot is `ScaleReportProps.hero` in `src/components/scale/ScaleReportShell.tsx`; the report pages in `src/pages/body/` currently omit it. The dashboard pages in the same folder already construct equivalent visuals worth extracting into a shared component.
- The new guard goes alongside `scripts/verify-hg-readings.ts` and follows the same pass/fail console pattern.
