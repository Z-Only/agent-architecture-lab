# Design specification

The selected full-screen visual concept is implemented as native accessible controls. The raster concept is a design reference, not a deployed interface or required build input.

## Visual system
- True white surfaces; cool canvas #f6f8fc; navy text #14243b; secondary #52647e; cobalt accent #2559ed; border #d8e1ef.
- System sans typography. App brand 19px/650; main task heading 30px/700; panel headings 19px/650; fields 14px/600; body 14px/1.5; descriptions 12px/1.5. No decorative eyebrow.
- Three-rail desktop: 276px controls, flexible canvas, 310px stress test; one open grid with vertical separators, no nested cards. At small widths, stack controls, blueprint, then stress test.
- Small 6–8px corners, thin quiet rules, no gradients, no card shadows. Buttons cobalt or navy, outlined native-like fields, 44px targets.
- Native SVG stroke icons 20px/1.7 strokes; branched-line mark, export arrow, run triangle, node symbols. Native HTML ordered diagram and trace; no raster UI.
- Motion limited to control transitions, disabled under reduced-motion.

## Allowed copy and hierarchy
Header: Agent Architecture Lab; EN; 中文; Light/Dark/System. Page header: Design the workflow. Test the failure.; Turn constraints into an agent architecture you can explain.; Export plan.
Panels: 01 Set constraints / Reset; 02 Your blueprint / selected pattern; 03 Stress test. Fields: Task shape, Defined steps, Open-ended; Side effects, Read only, Reversible, Irreversible; Use retrieval; Resume after interruption; Parallel work; Retry budget.
Canvas contains dynamic architecture nodes and sources-backed reason statements. Below: Why this structure; Before you ship.
Test rail: Deterministic simulation; Inject a fault; Run simulation; Simulation trace. Footer: A deterministic teaching model, not live LLM execution. Your settings stay in this browser.; How it works; Sources.

## Required functional deviations
- Omit the concept's invented timestamps and all invented quantitative tool performance. Trace sequence is a deterministic teaching output.
- Readiness checklist is advice, not pre-completed claims. Dynamic domain model labels and explanation may replace concept illustrative content.
- Default config may differ from screenshot to follow the validated domain defaults. Diagram never promises actual persistent resume or model execution.
- Theme and language native selects/choice buttons, fully translated labels. No dead toolbar controls.
- Sources and method disclosed through inline details beneath the working surface.

- A selectable, read-only Markdown plan preview is available in the export area. Live browser QA could not verify a completed download, so this preserves plan retrieval without depending on download support. It updates with the current configuration and trace.
