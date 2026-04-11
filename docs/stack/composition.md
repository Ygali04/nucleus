# Composition Layer

The composition layer is where Nucleus assembles a finished variant
from its raw materials: scripts, voiceover audio, B-roll clips,
avatar shots, music beds, brand kit assets, and motion text. The
composition tool is the workhorse of the engine — it's called for
every variant, often multiple times per iteration.

## The decision

**Primary: Remotion. Fast-path: FFmpeg via `ffmpeg-python`. Pre-processor: Auto-Editor. Educational diagrams: Manim CE + Mermaid.**

Remotion is the only tool in the OSS ecosystem that combines
deterministic React-component-based composition, headless server-side
rendering, first-class brand templating, active maintenance, and a
working production deployment story. Every alternative trades one of
these for another.

## Why Remotion

Remotion is a React-based programmatic video framework. Each
composition is a React component tree; frames are computed from
`useCurrentFrame()` and a `Composition` config. Brand kit, ICP, and
language are passed as `inputProps`, validated with Zod, and consumed
in components.

| Property | What Remotion delivers |
|---|---|
| Determinism | Explicit design goal. Same inputProps + same Remotion version + same assets reproduce the same output frame-by-frame. Critical for the iteration loop — when the editor changes a slice, only the changed slice differs. |
| Templating | React props with Zod validation. The Brand KB plumbs into composition components as a `theme` prop. ICP and language plumb the same way. |
| Render speed | Docker, 2–4 CPU cores: ~1 min 20s for a 30-second 1080p variant with `enableMultiProcessOnLinux`. Lambda: ~30 seconds for the same. |
| Composition primitives | Picture-in-picture, scene transitions, Lottie, Rive, 3D via Three.js, captions via `@remotion/captions`, audio mixing via `@remotion/media-utils`. |
| Brand templating | First-class. The brand kit is a Zod-typed object passed as `inputProps`, consumed via React context. |
| Server-side suitability | First class. Official Docker guide. Lambda, Cloud Run, Vercel Sandbox, Cloudflare Containers, GitHub Actions all documented. |
| Production users | Mozilla, Cal.com, BBC, Tella, Tome, Sourcegraph, Wordware. Powers Opus Clip's social variants and several YC AI-video startups. |
| Active development | Daily commits, weekly releases. v4.0.447 as of 2026-04-08. 31,849 commits on main. |

## What it costs

| Render path | Cost per 30-second 1080p variant |
|---|---|
| Docker on a c6i.xlarge worker | ~$0.004 marginal |
| Lambda (warm, S3 source) | ~$0.008–$0.010 |
| Lambda (cold) | ~$0.015 |

License is the trade-off: Remotion is source-available, free for
individuals and small teams. Company License starts at $100/month for
up to 4 seats; Enterprise tier starts at $500/month. For Nucleus's
team size and revenue model, the Company License is a non-issue
(~$1,200/year vs millions in pipeline value).

## Why not Revideo

[Revideo](https://github.com/redotvideo/revideo) is the closest MIT-
licensed alternative — a TypeScript fork of Motion Canvas with
headless rendering. It's a real option for teams blocked by
Remotion's license.

Three reasons it's the backup, not the primary:

1. **Maintenance momentum.** The Revideo team is building a closed
   editor (Midrender) on top of the same engine. Recent changes are
   not being upstreamed to OSS. The OSS repo is "maintained but not
   actively invested in."
2. **Less tooling.** Remotion has captions, transitions, Lottie,
   Rive, and 3D as first-party packages. Revideo has fewer of these
   and you'd build them yourself.
3. **Smaller production footprint.** Remotion has named enterprise
   customers and a deep documented Docker / Lambda story. Revideo
   has the engineering quality but not the deployment credibility.

If Remotion's license terms ever change in a hostile direction,
Revideo is the swap target. Until then, Remotion wins.

## The fast path: FFmpeg

For variants that don't need motion graphics — concatenations, music
bed swaps, format transcodes, simple lower thirds — FFmpeg via
`ffmpeg-python` is faster and cheaper than spinning up Chromium.

| Job type | Why FFmpeg |
|---|---|
| Concatenate two pre-rendered segments | Sub-10s render, no Chromium overhead |
| Swap a music bed on an existing variant | Sub-5s render |
| Transcode 16:9 → 9:16 | Sub-5s render |
| Add a lower-third caption to an existing variant | Sub-10s render with `drawtext` |

The fast path is ~50 lines of Python. It pays for itself at 10–20
fast-path jobs per day.

## The pre-processor: Auto-Editor

[Auto-Editor](https://github.com/WyattBlue/auto-editor) is a CLI tool
that removes silent or motionless sections from video. It's not a
compositor — it's an asset reducer that runs before composition.

Use case in Nucleus:

1. A source recording arrives with 60 seconds of "uh" / "let me think"
   / "where was I"
2. Auto-Editor trims the dead air down to 35 seconds of meaningful
   content
3. Remotion uses the trimmed clip as `<OffthreadVideo>` source

This is especially valuable for the **demo** and **knowledge**
archetypes, where the source recording is the bulk of the variant's
visual content.

Auto-Editor is Public Domain (Unlicense), single-binary, very fast,
and actively maintained (135 releases, 4.1k stars).

## Educational diagrams: Manim + Mermaid

The **education** archetype needs math/concept animations. Two tools
serve this:

| Tool | Use |
|---|---|
| **Manim CE** | Math animations, equations, abstract concept visualizations. Render scenes to MP4 separately, then composite as `<OffthreadVideo>` clips inside Remotion. |
| **Mermaid** | Flowcharts, sequence diagrams, state machines. Render to SVG and embed directly in a Remotion `<MermaidRenderer>` React component. |

Neither is a general-purpose compositor — they're asset producers
that feed into the Remotion shell.

## What was rejected

### Editly

| Reason | Detail |
|---|---|
| Bus factor 1 | Single maintainer; no npm release in 2025 |
| Maintenance signal | ~35 commits in 90 days, mostly dependency refactors |
| Templating | JSON DSL is OK but less flexible than React |
| Acceptable for | Small slideshow / clip-stitching workflows where you control the fork |

Editly's quality is fine. The sustainability is not.

### MoviePy

| Reason | Detail |
|---|---|
| Determinism | Numpy + PIL + FFmpeg can diverge across versions |
| Render speed | Slow for compositing because of numpy round-trips |
| Templating | Python-only; no DSL or designer-friendly format |
| Acceptable for | Python shops doing simple subtitling and slideshows |

MoviePy is fine for hobbyist Python video work. It's wrong for a
recursive iteration loop where determinism matters.

### MLT Framework

| Reason | Detail |
|---|---|
| Determinism | Effective but not formally guaranteed |
| Templating | Manual XML manipulation, no first-class theme concept |
| Text / motion text | Filters feel 2008 |
| Production users | Powers Shotcut, Kdenlive, broadcasters |
| Acceptable for | NLE-style workflows with Camera-imported XML manifests |

MLT is the workhorse behind Shotcut and Kdenlive. As a programmatic
brand-templating engine, the XML ergonomics are a poor fit for the
agentic workflow Nucleus has.

### Olive, Kdenlive, OpenShot Qt

GUI-first NLE editors. Headless rendering is technically possible
(Kdenlive has `kdenlive_render`) but the format is XML aimed at the
GUI. Not viable for a worker pipeline.

### DaVinci Resolve scripting

Blackmagic's scripting API works headless but the license terms for
server-farm automation are ambiguous. Not a viable production
dependency for SaaS use.

### Shotstack Studio SDK

[PolyForm Shield 1.0.0](https://polyformproject.org/licenses/shield/1.0.0/)
explicitly prohibits competitive use. Disqualifying for a
video-product company.

### Motion Canvas (without Revideo)

Excellent canvas-based composition framework. Headless rendering is
not first-class. Revideo exists exactly to fill this gap. If you want
this paradigm, use Revideo, not Motion Canvas directly.

## The architecture

The composition layer in Nucleus is **one orchestrator + multiple
renderers behind it**:

```
┌───────────────────┐
│ Orchestrator      │ ← The Nucleus orchestrator (see design/orchestrator.md)
│ (Python worker)   │
└──────┬────────────┘
       │
       ├──► Remotion render worker (90% of jobs)
       │     - Dockerized @remotion/renderer
       │     - enableMultiProcessOnLinux = true
       │     - Renders all four archetypes' shells
       │
       ├──► FFmpeg fast-path worker
       │     - ffmpeg-python or typed-ffmpeg
       │     - Concats, music swaps, format transcodes, simple lower thirds
       │
       ├──► Auto-Editor pre-processor
       │     - Trims source recordings before they hit Remotion
       │
       └──► Manim worker (rare, education archetype only)
             - Renders math/concept animations to MP4
             - Output goes back into Remotion as <OffthreadVideo>
```

Renderers are swappable behind the orchestrator. If Remotion's
license ever changes, the blast radius is one worker, not the whole
pipeline.

## Risk callouts

| Risk | Mitigation |
|---|---|
| Remotion price increase / license change | Budget Company License; isolate Remotion behind the orchestrator interface; Revideo as escape hatch |
| Chromium memory leaks at high concurrency | Per-render Chromium process recycling; periodic worker restart |
| Auto-Editor analysis edge cases on noisy audio | Fall back to "no trimming" if confidence is low |
| Manim render time on complex scenes | Render Manim scenes in advance; cache; reuse across variants |
| FFmpeg version drift | Pin FFmpeg version in worker container |

## When to revisit this decision

The composition layer should be revisited when:

- Remotion ships a breaking API change (unlikely; the project is
  stable)
- A new MIT-licensed contender appears with active enterprise
  adoption
- The cost of Lambda renders drops by ≥ 50%
- The fast-path FFmpeg worker handles ≥ 30% of all jobs (means we
  should invest more in it)
- A second Nucleus archetype demands a primitive Remotion can't
  provide
