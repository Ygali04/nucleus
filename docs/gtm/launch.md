# Launch Sequence

Nucleus rolls out in three phases — design partner, private beta,
general availability — over the same timeline as the engineering
[roadmap](../roadmap.md). Every phase has explicit entry criteria,
exit criteria, and a small set of measurable outcomes.

## Phase 0 — Pre-launch (current)

**Status:** in progress as of April 10, 2026.

### Goals

- The concept site (this site) is published and shared with the first
  prospective host product (TruPeer)
- Engineering kickoff agreed for April 14
- Compliance + license workstreams started in parallel

### Outputs

- This mkdocs site at `https://ygali04.github.io/nucleus/`
- The [post-meeting plan](../POST_MEETING_PLAN.md) and
  [next-session prompt](../NEXT_SESSION_PROMPT.md)
- Initial conversation with TruPeer's leadership

## Phase 1 — Design partner (Apr 14 → May 26)

**Goal:** one paid TruPeer customer producing 20+ variants per day
through Nucleus, with the engine running production workloads inside
TruPeer's product surface.

### Entry criteria

- Engineering kickoff complete
- TruPeer integration architecture approved by both teams
- TRIBE v2 license path resolved (commercial license signed OR
  fallback analyzer in active development)

### Workstreams

| Workstream | Owner | Output |
|---|---|---|
| MVP build | Nucleus engineering | End-to-end loop running marketing-archetype variants by Apr 28 |
| TruPeer integration | TruPeer + Nucleus engineering | "Multiply" panel embedded in TruPeer by May 12 |
| First customer onboarding | TruPeer success team + Nucleus | Glean / LambdaTest / Zuora-class customer onboarded by May 19 |
| Pricing pilot | TruPeer + Nucleus | Variant pricing model agreed and active by May 19 |
| Compliance | Nucleus + legal | DPA signed; sub-processor list published; SOC 2 inheritance documented |
| Marketing site | Nucleus | First-customer case study draft by May 26 |

### Exit criteria

- One paid customer producing 20+ variants/day
- Average score across delivered variants ≥ 72
- End-to-end cost per variant ≤ $1.00
- Average iteration count ≤ 4
- TruPeer is billing the customer through Nucleus's metering layer
- TruPeer leadership willing to act as a public reference

### Risks

| Risk | Mitigation |
|---|---|
| TRIBE v2 license stalls | Run fallback analyzer build in parallel from day 1 |
| TruPeer engineering bandwidth | Keep integration thin (web component / iframe); unblock with founder directly |
| First customer ramp slower than expected | Have a second customer in flight by week 4 of v1 |
| Cost ceiling breached | Cost monitoring dashboards live before first paid usage |

## Phase 2 — Private beta (May 27 → July 14)

**Goal:** 5+ paid TruPeer customers, aggregate throughput 100+
variants/day, first measurable in-market lift case study.

### Entry criteria

- Phase 1 exit criteria all met
- The first paid customer is willing to be a public reference
- The engine is stable enough that the on-call rotation can be
  expanded beyond the original engineer

### Workstreams

| Workstream | Owner | Output |
|---|---|---|
| Customer expansion | TruPeer success team | 5+ paid customers by July 14 |
| Brand-learned weights | Nucleus engineering | Auto-tuning from in-market data live |
| Multi-language validation | Nucleus + customer success | Top 10 languages validated by customer outputs |
| A/B feedback pipeline | Nucleus engineering | In-market data ingested and reflected in scoring weights |
| Case studies | Marketing | 1+ public case study with measurable lift |
| Education archetype | Nucleus engineering | Production-ready for one customer by July 1 |
| Sales enablement | TruPeer + Nucleus | Sales playbook in TruPeer's CRM |

### Exit criteria

- 5+ paid customers
- 100+ variants/day aggregate throughput
- 1+ public case study showing >20% lift on a social metric
- Customer NPS ≥ 50
- All four archetypes in production
- Architectural extraction readiness validated (engine deployable
  outside TruPeer's product shell without code changes)

### Risks

| Risk | Mitigation |
|---|---|
| Customer success bandwidth | Hire a dedicated CS lead by mid-Phase 2 |
| Quality variance across customers | Per-customer scoring weight tuning |
| Throughput hits GPU bottleneck | DataCrunch spot pool expansion + scoring queue tuning |
| First case study underwhelming | Pre-select customers most likely to show lift |

## Phase 3 — General availability (July 15 onward)

**Goal:** Nucleus is a publicly-available product feature inside
TruPeer with self-serve onboarding for new tenants.

### Entry criteria

- All Phase 2 exit criteria met
- Public marketing site live (or section of TruPeer's marketing site)
- Pricing page public
- Documentation site public (this site, expanded)
- Customer self-onboarding flow tested with at least one customer

### Launch activities

| Activity | Owner | Timing |
|---|---|---|
| Public announcement (TruPeer blog post) | TruPeer marketing | Day 0 |
| Nucleus marketing site live | Nucleus | Day 0 |
| Press release | TruPeer + Nucleus | Day 0 |
| Hacker News launch post | Nucleus | Day 1 |
| Product Hunt launch | TruPeer marketing | Day 7 |
| Founder interviews / podcast appearances | Nucleus founder | Days 14–60 |
| First "build with Nucleus" hackathon | Nucleus + TruPeer | Day 30 |
| Nucleus open-source benchmark suite (research roadmap item) | Nucleus engineering | Day 60 |

### Sustaining activities (post-GA)

- Weekly engineering blog posts (technical deep dives, customer
  metrics, postmortems)
- Monthly customer office hours
- Quarterly product update video
- Quarterly research blog post (neuro-marketing topics, see
  [research roadmap](../research/research-roadmap.md))
- Annual customer conference (when ARR justifies it)

## Beyond GA — multi-host expansion

The first host (TruPeer) is the proving ground. The second and third
hosts validate that Nucleus is portable.

### Second host (target: October 2026)

A second host product onboards as an OEM partnership. Likely
candidates:

- A creator-tooling platform (Descript, Riverside, Captions)
- A B2B sales-enablement platform (Allego, Highspot, Showpad)
- An LMS or learning platform (Articulate, iSpring, Skilljar)
- An agency-tools platform (Frame.io, Wipster)

The pitch: "Nucleus is the engine TruPeer uses for its
neuromarketing-grade variant production. Plug it into your product
the same way."

### Third host (target: Q1 2027)

A third host validates that the integration pattern is repeatable.
At three hosts, Nucleus has earned its standalone product surface and
the [extraction path](../integration.md#extraction-path-post-v2)
becomes a real conversation.

## Launch communication strategy

A small set of audiences, each with a tailored message.

### TruPeer customers (immediate)

> "TruPeer just got a new Multiply button. Click it on any recording
> and get persona-targeted variants generated, scored against a
> brain model, and ready for your social channels in minutes. Built
> on top of the same screen-recording library you already have."

### Performance marketers (broader)

> "Nucleus is the first AI video pipeline that uses a brain model
> as the reward function. Every variant gets scored before it ships,
> and the editor agent rewrites the underperforming slices until the
> variant crosses a quality threshold. The result is video that's
> already been validated for attention, emotional resonance, and
> memory encoding before a dollar of paid media touches it."

### Technical audience (engineering blog)

> "We built a recursive video generator that scores its own output
> with Meta FAIR's TRIBE v2 and re-renders only the changed slices
> on each iteration. Here's the architecture, the cost model, and
> what we learned shipping it inside TruPeer."

### Academic / research audience (papers, blog)

> "We published a benchmark for evaluating neuro-predictive video
> models on UGC-style content. Here's the dataset, the methodology,
> and how TRIBE v2 scores against it. The benchmark is open."

The four audiences have overlap but the language is tuned per
channel. The technical and academic audiences are the most novel
and the most likely to drive long-tail credibility.
