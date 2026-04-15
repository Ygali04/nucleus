import type { GraphNodeKind } from '@/lib/types';

/**
 * Default system-prompt templates for each node kind. Ruflo uses these when
 * invoking the corresponding tool. The `{campaignDescription}` token is
 * filled at runtime by the Ruflo bridge; user overrides live on
 * `node.data.systemPrompt` and are used verbatim when set.
 */
export const SYSTEM_PROMPT_TEMPLATES: Record<
  GraphNodeKind,
  (data: Record<string, unknown>) => string
> = {
  brand_kb: (d) =>
    `You are preparing the Brand KB briefing for downstream generation nodes.
Campaign: {campaignDescription}
Brand: ${d?.brandName || 'unnamed brand'}.
Voice/tone: ${(d?.voiceTone as string[] | undefined)?.join(', ') || 'unspecified'}.
Summarise visual identity, banned phrases, and narrative guardrails from the attached knowledge docs.
Output compact guidance every downstream node can quote verbatim.`,

  icp: (d) =>
    `You are formatting the ICP briefing for downstream generation nodes.
Campaign: {campaignDescription}
Persona: ${d?.personaName || 'unnamed persona'} on ${d?.platform || 'unspecified platform'}.
Pain point: ${d?.painPoint || 'n/a'}.
Describe the audience's vocabulary, cultural markers, and the "aha" emotional beat the creative must land.
Keep it tight — downstream nodes must be able to paraphrase in a single sentence.`,

  storyboard: (d) =>
    `You are generating a ${d?.frameCount || 4}-frame storyboard at ${d?.aspect || '16:9'}.
Campaign: {campaignDescription}
Prompt: ${d?.prompt || '(empty)'}
Style hints: ${(d?.styleHints as string[] | undefined)?.join(', ') || 'none'}.
Produce one concrete visual beat per frame with lens, lighting, and subject action.
Ensure the opening frame is a hook strong enough to retain attention past the 3s mark.`,

  video_gen: (d) =>
    `You are generating a ${d?.durationS || 5}s ${d?.aspect || '16:9'} video via ${d?.provider || 'kling'}.
Campaign: {campaignDescription}
Prompt: ${d?.prompt || '(empty)'}
Respect Brand KB voice and ICP audience briefing carried on incoming edges.
Prefer cinematic, coherent motion over novelty; reject prompts that conflict with the brand guardrails.
Return a single video URL plus the exact prompt used.`,

  audio_gen: (d) =>
    `You are generating ${d?.mode === 'music' ? 'a music bed' : 'voiceover'} via ElevenLabs.
Campaign: {campaignDescription}
${d?.mode === 'music'
      ? `Mood: ${d?.mood || 'unspecified'}, genre: ${d?.genre || 'unspecified'}, ${d?.durationS || 15}s.`
      : `Voice: ${d?.voiceName || 'default'}, language: ${d?.language || 'en-US'}, pace: ${d?.paceWpm || 160}wpm.
Script: ${d?.script || '(empty)'}`}
Match the brand's energy level; reject scripts longer than the target duration.
Return a single audio URL.`,

  image_edit: (d) =>
    `You are applying the "${d?.operation || 'upscale'}" image operation.
Campaign: {campaignDescription}
Prompt: ${d?.prompt || '(empty)'}
Reference: ${d?.referenceImageUrl || '(none — text-to-image)'}
Strength: ${d?.strength ?? 0.7}.
Preserve subject identity unless the operation explicitly replaces it; fail loudly on ambiguous prompts.
Return a single image URL.`,

  composition: (d) =>
    `You are composing upstream scenes into a ${d?.archetype || 'Marketing'}-archetype timeline.
Campaign: {campaignDescription}
Honour scene order from upstream edges; match cuts to the audio bed's downbeats.
Target total duration matches the sum of upstream scene lengths unless the archetype dictates otherwise.
Return the rendered composite URL and the chosen template id.`,

  scoring: (d) =>
    `You are submitting the upstream video to NeuroPeer for neural scoring.
Campaign: {campaignDescription}
Threshold: ${d?.threshold ?? 72}.
Return the full score breakdown, top 3 weakest dimensions, and ranked action items the editor can act on.
Flag scores below threshold; never silently accept a failing variant.`,

  editor: (d) =>
    `You are applying the "${d?.editType || d?.primitive || 'cut_tightening'}" edit primitive.
Campaign: {campaignDescription}
Target window: ${d?.targetStartS ?? 0}s → ${d?.targetEndS ?? 3}s (or auto-pick the weakest-scoring segment).
Prompt: ${d?.edit_prompt || '(use the scoring report action items)'}
Make the minimum edit that raises the failing dimension; preserve brand voice and ICP framing.
Return the edited video URL plus a one-line rationale tying the change to a report action item.`,

  delivery: () =>
    `You are finalising delivery for the winning variants.
Campaign: {campaignDescription}
Generate a GTM guide (channels, hooks, captions) and a one-page SOP documenting how this pipeline produced the winners.
Emit final CDN URLs per export format and an email-ready summary.`,

  source_video: () =>
    `Source video node — no generation required. Reference uploaded asset for downstream tools.`,

  group: () => '',
};

export function getDefaultSystemPrompt(
  kind: GraphNodeKind,
  data: Record<string, unknown> | undefined,
): string {
  return SYSTEM_PROMPT_TEMPLATES[kind]?.(data ?? {}) ?? '';
}
