# Stack Composition: OSS Video Tools for Programmatic Brand Video at Scale

*Evaluation target: a server-side worker pipeline producing 100+ branded video variants/day. Last updated 2026-04-09. All version numbers captured from upstream repos as of this date.*

## Scope and method

We are looking for tools that can sit inside a headless worker (Node/Python/Go), accept a parameterized input (brand kit, copy, media), and emit an MP4 deterministically. This rules out GUI-only editors except where they expose a scriptable render path. We evaluated each tool against the same 17-dimension rubric (see [What we need](#what-we-need)) and cross-checked maintenance signals against GitHub and the upstream package registries.

Tools in the review: Remotion, Revideo, Motion Canvas, Editly, Auto-Editor, Shotstack SDKs + ShotTower, Olive Editor, Kdenlive, MLT (melt), OpenShot / libopenshot, DaVinci Resolve scripting, MoviePy, FFmpeg + `ffmpeg-python` / `typed-ffmpeg`, Manim CE.

---

## Tool-by-tool evaluation

### 1. Remotion — the leading candidate

| Field | Value |
| --- | --- |
| Project / maintainer | [remotion-dev/remotion](https://github.com/remotion-dev/remotion) — Remotion GmbH (Zurich) |
| License | Source-available. Free for individuals, non-profits, and for-profit orgs up to 3 people. Company License from $100/mo (4 seats at $25/mo). Enterprise from $500/mo. Price increase in effect per [remotion.pro/price-increase](https://www.remotion.pro/price-increase). |
| Version | v4.0.447, released 2026-04-08. 608 total releases (multiple/week). |
| GitHub signal | 42.6k stars, 2.8k forks, 64 open issues, 31,849 commits on main. Commits are daily. |
| Core paradigm | Programmatic, React/TSX. Each composition is a React component tree; frames are computed from `useCurrentFrame()` and a `Composition` config. |
| Render engine | Headless Chromium via Puppeteer per frame, stitched with FFmpeg. `@remotion/renderer` exposes `renderMedia()` and `selectComposition()` for Node/Bun. |
| Determinism | Yes — explicit design goal. Same input props + same Remotion version + same assets reproduce the same frame. Fonts and randomness must be seeded; `random()` helper accepts a seed. |
| Templating | React props. Pass a JSON-shaped object as `inputProps`, validate with Zod, consume in components. Brand kit (colors, fonts, logos) is trivial: plumb a `theme` prop through context. |
| Render speed (30s 1080p) | Docker, 2–4 CPU cores: ~4 min without `enableMultiProcessOnLinux`, ~1 min 20s with it enabled. Lambda @ 2048MB default: ~30s for a 1-min video with distributed `framesPerLambda`. See [remotion.dev/docs/performance](https://www.remotion.dev/docs/performance). |
| CPU vs GPU | CPU-bound. GPU acceleration exists for WebGL content inside the Chromium layer but the render pipeline itself is CPU + memory. |
| Server-side / container | First-class. Official [Dockerizing guide](https://www.remotion.dev/docs/docker). Lambda, Cloud Run, Vercel Sandbox, Cloudflare Containers, GitHub Actions all documented. |
| Audio | Full: `<Audio>`, `<OffthreadVideo>`, multi-track mixing, voiceover sync via absolute frame positioning. `@remotion/media-utils` exposes waveform data. |
| Text / motion text | Anything CSS/SVG/Canvas. Animate with `interpolate()` and `spring()`. Google Fonts loader package. |
| Brand templating | Pass `theme: { colors, fonts, logoUrl }` as input prop — becomes the canonical pattern. |
| Composition primitives | Picture-in-picture (just stack `<OffthreadVideo>`), scene transitions via `@remotion/transitions`, Lottie, Rive, 3D via Three.js, captions via `@remotion/captions`. |
| Active dev | Extremely active. Daily commits, weekly releases. Remotion Skill for Claude Code shipped Feb 2026 (117k weekly installs). |
| Verifiable prod users | Customers listed on remotion.dev include Mozilla, Cal.com, Wordware, Tella, BBC, Tome, Sourcegraph. Video generation powered by Remotion underpins Opus Clip's social variants and several AI-video startups from YC W24/S24/W25. |
| Cost per render at scale | Lambda benchmark from [cost-example](https://www.remotion.dev/docs/lambda/cost-example) v4.0.381: $0.017 for a 1-min warm render from S3, $0.013 for 10s 4K. A 30-second 1080p warm render is ~$0.008–0.010 on Lambda. On a long-running Cloud Run or Docker worker, amortized cost at 100+ videos/day is dominated by idle time; a c6i.xlarge pinned at ~$0.17/hr and rendering 30-sec clips at ~1:20 gives a marginal cost around $0.004/render. |
| Best fit | Deterministic, high-volume, brand-templated short/mid form. Anything your designers can mock in CSS. |
| Worst fit | License math breaks for 4+ person commercial teams — you pay. Not great for workflows that need to ingest arbitrary camera footage and apply NLE-style transforms; it wants JSX compositions, not XML timelines. |

### 2. Revideo — the MIT-licensed alternative

| Field | Value |
| --- | --- |
| Project / maintainer | [redotvideo/revideo](https://github.com/redotvideo/revideo) — Midrender (YC S24) |
| License | MIT |
| Version | `@revideo/core` 0.10.4 (last major publish ~6 months ago), `@revideo/cli` 0.10.4 (~5 months ago), `@revideo/ui` 0.10.1 (~1 month ago). No tagged GitHub releases; versions are tracked via npm. |
| GitHub signal | 3.8k stars, 187 forks, 54 open issues, 1,124 commits. Cadence slowed after the team pivoted to Midrender; "recent changes have not yet been upstreamed to the open-source repo" per re.video. |
| Core paradigm | Programmatic TypeScript. Fork of Motion Canvas with headless rendering and a library-first API. Uses generator functions (`yield*`) for timelines. |
| Render engine | Canvas 2D via headless Chromium + FFmpeg for video frame extraction. Parallelized render pipeline. |
| Determinism | Design emphasizes reproducible output through explicit frame sequencing. Not as formally guaranteed as Remotion but effectively deterministic. |
| Templating | TSX scenes with variables injected at render time; supports dynamic inputs via CLI and HTTP endpoint. |
| Render speed | Claimed faster than Motion Canvas on raw Canvas-only compositions. No published 1080p/30s benchmark; practitioner reports put it in the same ballpark as Remotion when content is canvas-native. |
| CPU vs GPU | CPU-bound, same profile as Remotion. |
| Server-side / container | Yes — `@revideo/serve` exposes a rendering API meant to be deployed to Cloud Run or similar. SaaS template repo published. |
| Audio | Native audio synchronization supported (the key upgrade over Motion Canvas). |
| Text / motion text | Canvas-based animations, generator-timed. Less CSS-fluent than Remotion. |
| Brand templating | Pass input props via CLI/HTTP. Same pattern as Remotion but with Canvas-API primitives. |
| Composition primitives | 2D scene graph, transitions, PiP via layered `Video` nodes, audio beds. No built-in 3D. |
| Active dev | Warning signal: the team is building [Midrender](https://midrender.com/revideo) as a closed editor on top of the same engine, and changes are not being upstreamed. Treat OSS as maintained but not actively invested in. |
| Verifiable prod users | YC S24 company, used internally by the team for A/B video ad testing and Twitch highlight reels. No named external customers. |
| Cost per render | Comparable to Remotion Docker; no Lambda equivalent. |
| Best fit | Teams that cannot accept Remotion's company license and want TypeScript programmability. |
| Worst fit | High-stakes production where you need sustained engineering investment and vendor accountability. |

### 3. Motion Canvas — included as context

[motion-canvas/motion-canvas](https://github.com/motion-canvas/motion-canvas), MIT, v3.17.2 (Dec 2024), 18.4k stars, 739 forks, 149 issues. Primary author (Aarthi Figueroa) positioned Motion Canvas as a standalone editor, not a server library. **Headless rendering is not first-class** — Revideo exists precisely to fill this gap. If you want a canvas-based programmatic engine on a worker, pick Revideo, not Motion Canvas.

### 4. Editly

| Field | Value |
| --- | --- |
| Project / maintainer | [mifi/editly](https://github.com/mifi/editly) — Mikael Finstad, solo maintainer |
| License | MIT |
| Version | 0.15.0-rc.1. Last commit 2025-02-20. ~35 commits in last 90 days before that (dependency refactors, not feature work). |
| GitHub signal | 5.4k stars, 366 forks, 72 open issues. 430 commits total. Bus factor = 1. |
| Core paradigm | Declarative JSON/JS edit spec → FFmpeg commands. `editly config.json5` from CLI, or `editly(editSpec)` from Node. |
| Render engine | FFmpeg. Uses `fabric` / `gl-transitions` for canvas work and GLSL transitions; has historically relied on `headless-gl` which is itself the main install-friction point. |
| Determinism | FFmpeg-level reproducibility. No explicit determinism contract; same JSON + same FFmpeg version should produce the same output. |
| Templating | JSON/JS edit spec with `clips[].layers[]` (video, audio, image, title, canvas, subtitle, slide-in-text, news-title, gl-transition). Brand kit via variables in the template object. |
| Render speed | FFmpeg-native — very fast for simple concatenations. A 30s 1080p with 3–5 layers and one GLSL transition renders in <30s on a 4-core worker. |
| CPU vs GPU | CPU plus OpenGL for GL transitions. `headless-gl` dependency is the server-side sore spot. |
| Server-side / container | Yes, but Linux ships require installing `libgl1-mesa-dev`, `xvfb`, and friends. Dockerfiles available but not official. |
| Audio | Multiple tracks, crossfade, normalization, keep-source-audio toggle. |
| Text / motion text | Built-in title layer types (news-title, slide-in-text, customizable). Less flexible than React/TSX. |
| Brand templating | Direct — JSON variables. |
| Composition primitives | PiP via overlapping layers, GLSL transitions, image slideshows. No real "scene" abstraction. |
| Active dev | Slow-but-alive. Single maintainer. No releases on npm in 2025–2026 past 0.15.0-rc.1 even as commits landed. |
| Verifiable prod users | Powers a long tail of indie video apps; no enterprise references. |
| Cost per render | Lowest of any option here on raw CPU. |
| Best fit | Quick slideshow and clip-composition workflows where the edit is mostly "stack clips, add titles, transition". |
| Worst fit | Complex motion graphics. Bus-factor-1 projects you're betting a P&L on. |

### 5. Auto-Editor

| Field | Value |
| --- | --- |
| Project / maintainer | [WyattBlue/auto-editor](https://github.com/WyattBlue/auto-editor) |
| License | Public Domain (Unlicense) |
| Version | 30.1.0 (2026-03-27), 135 releases total, 2,015 commits |
| GitHub signal | 4.1k stars, 532 forks, 2 open issues. Very active, Nim rewrite. |
| Paradigm | CLI post-processor. Analyses existing footage and removes silent/motionless sections. |
| Engine | FFmpeg + custom Nim analyzers. |

**Classification**: not a composition tool. Auto-Editor *reduces* existing footage — it does not compose branded variants. Relevant only as a stage 2 in a pipeline that needs to tighten a voiceover take or a screen recording before handing it to Remotion/MLT.

### 6. Shotstack SDKs and ShotTower

Shotstack itself is a commercial SaaS. All of the "[shotstack/*-sdk](https://github.com/shotstack)" repos are API clients for their hosted render farm — they do not render anything locally.

Two OSS-adjacent pieces are worth noting:

- **[shotstack/shotstack-studio-sdk](https://github.com/shotstack/shotstack-studio-sdk)** — browser-based editor UI, licensed **PolyForm Shield 1.0.0** (source-available, explicitly prohibits use that competes with Shotstack). 43 stars. Not a server renderer, and the license would kill any SaaS use.
- **[DblK/shottower](https://github.com/DblK/shottower)** — AGPL-3.0, 50 stars, last commit 2024-04-19. Self-hosted implementation of the Shotstack JSON spec that maps it to FFmpeg commands. ~40–50% feature coverage, marked unstable by the author, **stalled for a year**. Interesting as a study in "how to implement Shotstack-style JSON on your own FFmpeg", not viable as a dependency.

Shotstack's own product is a fine fallback if buying beats building, but it does **not** contribute an OSS render engine to this evaluation.

### 7. Olive Editor

[olive-editor/olive](https://github.com/olive-editor/olive), GPL-3.0, v0.2.0 nightly, 9.0k stars, 601 forks. C++/Qt/OpenGL NLE. GUI-only — **no CLI or headless mode documented**. The project README describes itself as "alpha software and highly unstable." Not a candidate for a worker pipeline.

### 8. Kdenlive

[KDE/kdenlive](https://github.com/KDE/kdenlive), GPL-3.0, 4.9k stars, 395 forks, active (daily commits on KDE Invent). Kdenlive is a Qt NLE built on top of MLT. It has a headless render path — `kdenlive_render` can render a `.kdenlive` project file — but the project format is XML aimed at the GUI, and KDE treats the GUI as the product. If you need MLT, use MLT directly (next entry).

### 9. MLT Framework (`melt` CLI)

| Field | Value |
| --- | --- |
| Project / maintainer | [mltframework/mlt](https://github.com/mltframework/mlt) — Dan Dennedy et al. |
| License | LGPL-2.1 |
| Version | 7.36.1 (2025-12-31). 6,644 commits, active master. |
| GitHub signal | 1.8k stars, 361 forks, 45 open issues. |
| Paradigm | Declarative MLT-XML + imperative `melt` CLI. Also C/C++ API and Python bindings via `python-mlt`. |
| Engine | Native C, wraps FFmpeg + `frei0r` + LADSPA + SDL. |
| Determinism | Not a formal guarantee but reproducible given identical inputs/codecs. |
| Templating | MLT-XML files can be generated by your own code; `melt` consumes them. You can build them from Node via `redmantech/node-mlt` or by string-templating. |
| Render speed | Native C → fast. Comparable to hand-written FFmpeg pipelines. |
| CPU vs GPU | CPU; optional GPU-accelerated effects via frei0r. |
| Server-side / container | Excellent. Headless by design, restricted mode available. Powers Shotcut, Kdenlive, Flowblade, OpenShot (indirectly). |
| Audio | Multi-track mixer, filters, LADSPA plugins. |
| Text / motion text | Via `dynamictext`, `qtext`, `affine` filters. Less expressive than a React renderer. |
| Brand templating | XML variable substitution; you template the XML yourself. No first-class "theme" concept. |
| Composition primitives | Full NLE primitives: tracks, transitions (`luma`, `composite`), PiP, chroma key, speed ramps. |
| Active dev | Active, quarterly releases. |
| Verifiable prod users | Powers Shotcut (Meltytech), Kdenlive, OpenShot indirectly. Used by broadcasters and academic workflows. |
| Cost per render | Lowest of the composition tools — pure C, small footprint, scales to embedded. |
| Best fit | When you already have NLE-style assets and want pure FFmpeg-class speed with an XML manifest. |
| Worst fit | Anything requiring rich motion-graphics text — the filters feel 2008. |

### 10. OpenShot / libopenshot

[OpenShot/libopenshot](https://github.com/OpenShot/libopenshot), LGPL-3.0, v0.7.0 (2026-04-08), 1.5k stars. C++ library with Python and Ruby bindings; the GUI is [OpenShot/openshot-qt](https://github.com/OpenShot/openshot-qt) (v3.5.1, 5.6k stars, GPLv3). libopenshot gives you a scriptable pipeline (`openshot.Clip`, `openshot.Timeline`, `openshot.FFmpegWriter`) and can run headless. It's a reasonable FFmpeg-wrapping engine in Python, but the library has less mindshare than MoviePy or Remotion and the Python bindings have historically lagged the C++ library on installability.

### 11. DaVinci Resolve scripting

Blackmagic's [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve) (free + Studio) exposes a Python scripting API (`-nogui` headless mode, env vars `RESOLVE_SCRIPT_API`/`RESOLVE_SCRIPT_LIB`). Studio ($295 one-time) is required for Python; the free version only exposes Lua. Community wrappers: `pydavinci`, `pybmd`. Coverage ~30–40% of the app surface; Fairlight audio is mostly closed, OFX plugins invisible, no AI features scriptable. **Not OSS**, and the headless license is ambiguous for server-farm automation — you'd need to confirm with Blackmagic. Useful for one-off broadcast automation, not a multi-worker SaaS backbone.

### 12. MoviePy

| Field | Value |
| --- | --- |
| Project / maintainer | [Zulko/moviepy](https://github.com/Zulko/moviepy) |
| License | MIT |
| Version | v2.2.1 (2025-05-21), 1,530 commits, active team (Zulko + tburrows13 + keikoro) |
| GitHub signal | 14.5k stars, 2.1k forks, 62 open issues |
| Paradigm | Python fluent API. `VideoFileClip(...).subclipped(...).with_position(...).with_effects([...])`. Breaking changes from v1→v2 in 2024. |
| Engine | FFmpeg wrapper. Frames imported into numpy arrays, manipulated in Python, exported via FFmpeg. Slower than raw FFmpeg due to Python↔numpy overhead. |
| Determinism | Not guaranteed — numpy + PIL + FFmpeg can diverge across versions. |
| Templating | Python code templating. No DSL; you write functions that assemble clips. |
| Render speed | Slow for heavy compositing because of numpy round-trips. Fine for subtitling and basic composition. |
| CPU vs GPU | CPU, single-process per render. |
| Server-side / container | Yes. Common Django/Flask/FastAPI embeddings. A recent (Feb 2026) `moviepy-mcp` project wraps it for agent use. |
| Audio | `AudioFileClip`, mixing, effects. |
| Text / motion text | `TextClip` via ImageMagick; motion via `with_position` lambdas. Adequate, not rich. |
| Brand templating | You write the mapping from brand kit → clips by hand. |
| Production | Long tail of Python-centric teams; no marquee brands. |
| Best fit | Python shops that want a single dependency and are composing talking-head / slideshow / captioned content. |
| Worst fit | High-volume deterministic brand pipelines. Render speed and nondeterminism bite you. |

### 13. FFmpeg directly (with `ffmpeg-python` or `typed-ffmpeg`)

| Field | Value |
| --- | --- |
| Project | [kkroening/ffmpeg-python](https://github.com/kkroening/ffmpeg-python) (Apache-2.0), [livingbio/typed-ffmpeg](https://github.com/livingbio/typed-ffmpeg) (MIT). |
| Paradigm | Build a filter-graph in code (`ffmpeg.input(...).filter('overlay', ...).output(...)`), run. |
| Engine | FFmpeg. Fastest and leanest option. |
| Determinism | As deterministic as FFmpeg itself, which is to say "yes, pinned to a build". |
| Templating | You're writing the templating layer. |
| Render speed | Ceiling. A 30s 1080p branded template (lower third, logo, music bed) renders in <10s on a modest worker. |
| Server-side | Trivial — it's just FFmpeg. |
| Audio | Everything FFmpeg does. |
| Text / motion text | `drawtext`, `subtitles`, `libass`. Animated via `enable=` expressions and `between()`. Feasible but ugly past a few elements. |
| Best fit | When every millisecond of CPU matters and the compositions are parameterized but structurally fixed (e.g., 100 variants of the same lower-third layout). |
| Worst fit | Anything requiring non-trivial motion design or designers in the loop. |

### 14. Manim CE (and Manim GL)

[ManimCommunity/manim](https://github.com/ManimCommunity/manim), MIT, v0.20.1 (2026-02-27), 37.7k stars, 2.8k forks. [3b1b/manim](https://github.com/3b1b/manim) ("manimgl") MIT, v1.7.2, 85.9k stars. Python animation engine for math/diagrams; CLI rendering via `manim -ql`, Docker supported, Jupyter integration. Heavy dependency tree (LaTeX, Pango, FFmpeg, OpenGL). Valuable as a **component** in the pipeline — render math/diagram segments separately, then composite into Remotion or MLT. Not a general-purpose brand-video composer.

---

## Decision matrix — top 6

| Dimension | Remotion | Revideo | MLT (`melt`) | Editly | MoviePy | FFmpeg + ffmpeg-python |
| --- | --- | --- | --- | --- | --- | --- |
| License | Source-avail ($100/mo+) | MIT | LGPL-2.1 | MIT | MIT | Apache-2.0 / FFmpeg LGPL/GPL |
| Paradigm | React/TSX | TypeScript generators | MLT-XML + CLI | JSON | Python fluent | Python filter graph |
| Engine | Headless Chromium + FFmpeg | Canvas + FFmpeg | Native C + FFmpeg | FFmpeg + OpenGL | FFmpeg + numpy | FFmpeg |
| Determinism | Explicit, formal | Effective | Effective | Effective | Weak | Strong (pin FFmpeg) |
| Templating ergonomics | Best in class (React props + Zod) | Good (TSX) | Poor (XML) | OK (JSON) | OK (Python) | DIY |
| Render speed (30s 1080p) | 1m20s Docker / ~30s Lambda | ~1–2 min Docker | <30s | <30s | 1–3 min | <10s |
| Server / container | Official Docker, Lambda, Cloud Run | Cloud Run recipe | Native fit | DIY Docker | DIY | Trivial |
| Audio / voiceover | Rich (`@remotion/media-utils`, captions) | Native | Full NLE | Multi-track | Good | Full |
| Brand templating | First class (theme prop) | First class (inputs) | Manual (XML vars) | First class (JSON) | Manual (Python) | DIY |
| Composition primitives | Full + 3D + Lottie + Rive | 2D scene graph | Full NLE | Layers + GL | Clip graph | Filter graph |
| Active dev | Daily commits, weekly releases | Slow (team on Midrender) | Quarterly | ~1 committer | Active | FFmpeg: continuous |
| Verifiable prod users | Mozilla, Cal.com, BBC, Tella, Tome | None named externally | Shotcut, Kdenlive, broadcasters | Indie long tail | Long tail | Everyone |
| Marginal cost / render at scale | ~$0.004 Docker, ~$0.008–0.010 Lambda | ~$0.005 Docker | <$0.002 | <$0.002 | ~$0.01 | <$0.001 |
| Risk | Licensing cost + lock-in | Maintenance momentum | XML ergonomics, no motion text | Bus factor 1 | Determinism | DIY everything |

---

## Recommendations by production need

### Short-form (15–60s) deterministic brand templating with text overlays and brand-kit substitution → **Remotion**

This is the exact use case Remotion was built for, and it is measurably ahead of every alternative on determinism, templating ergonomics, and designer-developer handoff. The company license cost is real but small relative to one engineer-day. Fallback if license is a hard no: **Revideo** (accept the maintenance risk) or **FFmpeg + ffmpeg-python** (accept the DX pain for a fixed layout template).

### Mid-form (2–6 min) explainer with diagrams and screen-recording reuse → **Remotion** for the composition shell + **Auto-Editor** for tightening recorded takes

Use Auto-Editor to trim dead air from screen-recording sources, pull the results into Remotion as `<OffthreadVideo>`, and lay motion titles/lower-thirds on top. Remotion's `@remotion/captions` handles transcription-driven subtitles. **MLT** is a credible runner-up if you want to avoid the Remotion license at this length.

### Long-form (5–15 min) educational content with Manim/Mermaid integration → **Remotion shell + Manim CE as pre-rendered segments**

Render Manim scenes to WebM/MP4 artifacts in a separate worker, then compose them as clips inside a Remotion composition alongside narration and brand chrome. Mermaid diagrams render as SVG and can sit directly in a React component via `<MermaidRenderer>`; animate their entrance with Remotion's `interpolate`. Do **not** try to use Manim as the outer compositor — its text and layout primitives are math-oriented.

### Atmospheric B-roll generation → **Not a composition-tool problem**

This is a diffusion model call (Runway, Luma Dream Machine, Sora, Pika, or self-hosted Mochi / CogVideoX / Hunyuan). The composition tool's job is to ingest the generated B-roll as `<OffthreadVideo>` and overlay the brand treatment. If you must do it without a diffusion API, the honest answer is to use Pexels/Pixabay free-license libraries and stitch with **FFmpeg** or **MLT**.

---

## Architecture recommendation: multi-tool pipeline, single orchestrator

**Run a small number of composition tools behind a higher-level orchestrator.** Do not try to do it all in one tool, and do not run six. The concrete shape:

```
┌───────────────────┐
│ Orchestrator      │  ← Trigger API, job queue (BullMQ / Celery / Railway workers)
│ (TypeScript or    │    - job spec validation (Zod / Pydantic)
│  Python worker)   │    - fan-out to renderers
└──────┬────────────┘    - retry, webhooks, cost tracking
       │
       ├──► Remotion render worker (90% of jobs)
       │        - Dockerized @remotion/renderer
       │        - enableMultiProcessOnLinux = true
       │        - renders short/mid/long form brand templates
       │
       ├──► FFmpeg fast-path worker (simple concats, music beds, format transcodes)
       │        - ffmpeg-python or typed-ffmpeg
       │        - used when the job is "stitch these 3 clips with this lower third"
       │
       ├──► Auto-Editor pre-processor (optional stage)
       │        - runs before Remotion on screen-recording ingest
       │
       └──► Manim CE worker (rare, long-form educational only)
                - asset producer, output goes back into Remotion
```

**Why this shape:**

1. One primary composition tool keeps the designer/developer workflow simple and the determinism story tight. Remotion is that tool.
2. FFmpeg as a **fast path** saves Chromium startup time and dollars on jobs that don't need motion graphics — e.g., swapping a music bed, concatenating two pre-rendered segments, transcoding to vertical. The fast-path worker is ~50 lines of Python and pays for itself at 10–20 jobs/day.
3. Auto-Editor and Manim are **asset producers**, not compositors. Keeping that distinction in the architecture prevents the temptation to overload your primary compositor.
4. The orchestrator owns job spec validation, retries, webhooks, and cost accounting. Any of the renderers should be swappable behind it — if Remotion's license terms change, the blast radius is one worker, not the whole pipeline.

**Do not run Kdenlive/Olive/OpenShot-GUI/DaVinci Resolve in this pipeline.** They are either GUI-first, license-ambiguous, or both. Use MLT directly if you specifically need the NLE lineage; otherwise skip.

---

## Risk callouts

### License risk

| Tool | License | Risk for a SaaS/worker pipeline |
| --- | --- | --- |
| Remotion | Source-available | Cost and legal surface. Company License required above 3 employees; Enterprise required at volume. Renewal cadence and price changes (2026 bump from $15→$25/seat/mo) are vendor-controlled. Mitigation: budget $1k/year minimum and isolate behind the orchestrator so you can swap. |
| Revideo | MIT | Clean. Maintenance risk is the concern, not license. |
| MoviePy | MIT | Clean. |
| Editly | MIT | Clean. Bus factor = 1 is the bigger issue. |
| MLT | LGPL-2.1 | Linking safe. Some plugins (frei0r) are GPL — keep them isolated if you distribute binaries. |
| OpenShot / libopenshot | LGPL-3.0 lib, GPLv3 GUI | Library is usable from closed services. Do **not** bundle the Qt GUI. |
| Kdenlive / Olive | GPLv3 | Contagion if you distribute. Running the binary on your own server to produce output and shipping only the output is usually fine, but confirm with counsel before wrapping it in a SaaS. |
| Shotstack Studio SDK | PolyForm Shield 1.0.0 | **Explicitly prohibits competing use.** Do not adopt for a video-editing product. |
| DaVinci Resolve | Commercial | Scripting headless use is legally fuzzy at server-farm scale. Do not build a business on it. |
| ShotTower | AGPL-3.0 | Network-copyleft: any modifications must be open-sourced to users of the service. Only a fit if you're open to AGPL compliance. |
| FFmpeg | LGPL or GPL depending on build flags | Default builds are LGPL-safe. If you enable GPL codecs (x264, x265), you inherit GPL obligations on distribution — not on hosted use, but double-check with your legal team. |

### Pricing/vendor-change risk

- **Remotion Lambda** costs scale with AWS. Remotion's own per-render component is relatively small; the larger pricing risk is the seat-based Company License escalation. Remotion raised list prices in 2026.
- **Shotstack** (if you fall back to it) is a hosted API — pricing is their call and has changed multiple times.
- **DaVinci Resolve Studio** is a one-time $295 per seat, but headless multi-node use terms are set by Blackmagic and have historically been restrictive.

### Stalled-maintenance risk

- **Editly**: actively refactored by a solo maintainer as of Feb 2025, but no npm release in 2025. Treat as "bus factor 1, you own the fork."
- **Revideo**: team is building Midrender; upstream changes are not being pushed back into OSS. Usable now, but plan for a fork the day you need a feature they don't.
- **Motion Canvas**: maintained but not headless-first. Do not pick as a worker compositor.
- **Olive Editor**: still alpha after years.
- **ShotTower**: last commit April 2024. Dead for our purposes.
- **OpenShot-qt**: active at v3.5.1, but the ecosystem around `libopenshot` Python bindings is thin relative to MoviePy/Remotion.

### Determinism risk

- **MoviePy**: nondeterminism across numpy/PIL/FFmpeg versions is a real concern. Pin everything or choose a tool with stronger guarantees if you're reproducing renders.
- **DaVinci Resolve**: proprietary render engine; changes across point releases can alter output.
- **Manim**: font and LaTeX rendering diverges across Linux distros. Containerize aggressively.

---

## Bottom line

For the stated goal (100+ branded variants per day, server-side worker, deterministic, brand-kit-driven), the answer is:

1. **Primary compositor: Remotion** on Docker with `enableMultiProcessOnLinux` for daily volume, Lambda for bursts. Budget the Company License.
2. **Fast-path: FFmpeg** via `ffmpeg-python` / `typed-ffmpeg` for simple jobs that don't need motion graphics.
3. **Pre-processor: Auto-Editor** for cleaning voiceover/screen-recording input.
4. **Asset producer (optional): Manim CE** for math/educational inserts.
5. **Do not rely on: Editly (bus factor), Shotstack Studio SDK (license), Olive/Kdenlive/Resolve (GUI-first), Motion Canvas (not headless), MoviePy (determinism).**

The single most load-bearing decision is Remotion vs Revideo. Pick Remotion unless the license math or vendor-lock-in argument is dispositive for your org; in that case pick Revideo and accept the upstream-momentum risk.

---

## Sources

- [Remotion GitHub](https://github.com/remotion-dev/remotion) · [Remotion docs: SSR](https://www.remotion.dev/docs/ssr) · [SSR comparison](https://www.remotion.dev/docs/compare-ssr) · [Lambda cost example](https://www.remotion.dev/docs/lambda/cost-example) · [Performance tips](https://www.remotion.dev/docs/performance) · [Lambda concurrency](https://www.remotion.dev/docs/lambda/concurrency) · [License doc](https://www.remotion.dev/docs/license) · [Company licenses blog](https://www.remotion.dev/blog/company-licenses) · [Price increase notice](https://www.remotion.pro/price-increase)
- [Revideo GitHub](https://github.com/redotvideo/revideo) · [Revideo docs](https://docs.re.video/) · [re.video landing](https://re.video/) · [Midrender (re.video redirect)](https://midrender.com/revideo) · [@revideo/core on npm](https://www.npmjs.com/package/@revideo/core)
- [Motion Canvas GitHub](https://github.com/motion-canvas/motion-canvas)
- [Editly GitHub](https://github.com/mifi/editly) · [Editly on npm](https://www.npmjs.com/package/editly)
- [Auto-Editor GitHub](https://github.com/WyattBlue/auto-editor)
- [Shotstack org](https://github.com/shotstack) · [shotstack-studio-sdk (PolyForm Shield)](https://github.com/shotstack/shotstack-studio-sdk) · [ShotTower](https://github.com/DblK/shottower)
- [Olive Editor GitHub](https://github.com/olive-editor/olive)
- [Kdenlive GitHub mirror](https://github.com/KDE/kdenlive)
- [MLT Framework GitHub](https://github.com/mltframework/mlt) · [MLT melt docs](https://www.mltframework.org/docs/melt/) · [MLT FAQ](https://www.mltframework.org/faq/)
- [OpenShot-qt GitHub](https://github.com/OpenShot/openshot-qt) · [libopenshot GitHub](https://github.com/OpenShot/libopenshot)
- [MoviePy GitHub](https://github.com/Zulko/moviepy) · [MoviePy docs](https://zulko.github.io/moviepy/)
- [ffmpeg-python GitHub](https://github.com/kkroening/ffmpeg-python) · [typed-ffmpeg GitHub](https://github.com/livingbio/typed-ffmpeg)
- [Manim CE GitHub](https://github.com/ManimCommunity/manim) · [manimgl GitHub](https://github.com/3b1b/manim)
- [DaVinci Resolve scripting (unofficial docs)](https://deric.github.io/DaVinciResolve-API-Docs/) · [Wild Lion Media Python guide](https://wildlion.media/davinci-resolve-python-scripting-the-complete-guide-to-the-api/)
- Performance reference: ["Why I Chose Remotion + FFmpeg for SSR" on dev.to](https://dev.to/dwelvin_morgan_38be4ff3ba/why-i-chose-remotion-ffmpeg-for-server-side-video-rendering-4c1g) · ["How to Run Remotion Docker" (CrePal)](https://crepal.ai/blog/aivideo/blog-how-to-run-remotion-in-docker/) · [Remotion vs Motion Canvas vs Revideo 2026 (BuildPilot)](https://trybuildpilot.com/363-remotion-vs-motion-canvas-vs-revideo-2026)

## What we need

*(For reference — the 17 dimensions this evaluation scored each tool against.)* Project + maintainer + license + GitHub URL · Core paradigm · Render engine · Determinism · Templating · Render speed for 30s 1080p · CPU vs GPU · Server-side suitability · Audio support · Text / motion text · Brand templating · Composition primitives · Active development signal · Verifiable production deployments · Cost per render at scale · Best fit use cases · Worst fit / known limitations.
