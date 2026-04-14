import type { GraphEdgeMeta, GraphNodeMeta } from '@/lib/types';
import { primaryOutputType } from '@/lib/node-data-types';

export type CampaignArchetype = 'demo' | 'marketing' | 'knowledge' | 'education';

export type ArchetypeIconName =
  | 'Sparkles'
  | 'Megaphone'
  | 'BookOpen'
  | 'GraduationCap';

export interface ArchetypeConfig {
  id: CampaignArchetype;
  label: string;
  tagline: string;
  iconName: ArchetypeIconName;
  useCase: string;
  defaultNodes: GraphNodeMeta[];
  defaultEdges: GraphEdgeMeta[];
}

const COL = 320;
const ROW = 200;

/** Shape a single seed node with sensible defaults. */
function seedNode(
  id: string,
  label: string,
  kind: GraphNodeMeta['kind'],
  col: number,
  row: number,
  extras: Partial<
    Pick<GraphNodeMeta, 'subtype' | 'metaTag' | 'status' | 'statusText' | 'data'>
  > = {},
): GraphNodeMeta {
  const needsConfig = kind === 'brand_kb' || kind === 'icp';
  return {
    id,
    label,
    kind,
    status: extras.status ?? 'idle',
    statusText:
      extras.statusText ?? (needsConfig ? 'Needs configuration' : 'Ready'),
    subtype: extras.subtype,
    metaTag: extras.metaTag ?? null,
    x: col * COL,
    y: row * ROW,
    data: extras.data,
  };
}

function dataflow(
  id: string,
  source: string,
  target: string,
  label?: string,
): GraphEdgeMeta {
  return { id, source, target, kind: 'dataflow', label };
}

/** Colors each edge by its source node's primary output data type. */
function annotateEdges(
  nodes: GraphNodeMeta[],
  edges: GraphEdgeMeta[],
): GraphEdgeMeta[] {
  const kindById = new Map(nodes.map((n) => [n.id, n.kind]));
  return edges.map((e) => {
    const kind = kindById.get(e.source);
    if (!kind) return e;
    return { ...e, data: { ...(e.data ?? {}), dataType: primaryOutputType(kind) } };
  });
}

/** Demo: linear product walkthrough. */
const DEMO_NODES: GraphNodeMeta[] = [
  seedNode('demo-brandkb', 'Brand KB', 'brand_kb', 0, 0),
  seedNode('demo-icp', 'ICP', 'icp', 1, 0),
  seedNode('demo-videogen', 'Video Gen', 'video_gen', 2, 0, {
    subtype: 'product',
    metaTag: 'Product walkthrough',
  }),
  seedNode('demo-audiogen', 'Audio Gen', 'audio_gen', 3, 0, {
    subtype: 'narration',
    metaTag: 'Narration',
  }),
  seedNode('demo-composition', 'Composition', 'composition', 4, 0, {
    subtype: 'DemoArchetype',
    metaTag: 'DemoArchetype',
  }),
  seedNode('demo-scoring-1', 'Scoring', 'scoring', 5, 0, { subtype: 'initial' }),
  seedNode('demo-editor', 'Editor', 'editor', 6, 0),
  seedNode('demo-scoring-2', 'Scoring', 'scoring', 7, 0, { subtype: 'rescore' }),
  seedNode('demo-delivery', 'Delivery', 'delivery', 8, 0),
];

// Closed-loop semantics: brand + ICP fan out to generators; report feeds editor;
// composition feeds editor source video; scoring-2 can loop back to editor for
// additional passes below threshold.
const DEMO_EDGES: GraphEdgeMeta[] = [
  dataflow('demo-e1', 'demo-brandkb', 'demo-videogen'),
  dataflow('demo-e2', 'demo-brandkb', 'demo-audiogen'),
  dataflow('demo-e3', 'demo-icp', 'demo-videogen'),
  dataflow('demo-e4', 'demo-icp', 'demo-audiogen'),
  dataflow('demo-e5', 'demo-videogen', 'demo-composition'),
  dataflow('demo-e6', 'demo-audiogen', 'demo-composition'),
  dataflow('demo-e7', 'demo-composition', 'demo-scoring-1'),
  dataflow('demo-e8', 'demo-composition', 'demo-editor'),
  dataflow('demo-e9', 'demo-scoring-1', 'demo-editor'),
  dataflow('demo-e10', 'demo-editor', 'demo-scoring-2'),
  dataflow('demo-e11', 'demo-scoring-2', 'demo-delivery'),
];

/** Marketing: branching hero ad with b-roll. */
const MARKETING_NODES: GraphNodeMeta[] = [
  seedNode('marketing-brandkb', 'Brand KB', 'brand_kb', 0, 0),
  seedNode('marketing-icp', 'ICP', 'icp', 1, 0),
  seedNode('marketing-videogen-hero', 'Video Gen', 'video_gen', 2, -1, {
    subtype: 'hero',
    metaTag: 'Hero shot',
  }),
  seedNode('marketing-videogen-broll', 'Video Gen', 'video_gen', 2, 1, {
    subtype: 'b-roll',
    metaTag: 'B-roll',
  }),
  seedNode('marketing-audiogen', 'Audio Gen', 'audio_gen', 3, 0, {
    subtype: 'voiceover',
    metaTag: 'Voiceover',
  }),
  seedNode('marketing-composition', 'Composition', 'composition', 4, 0, {
    subtype: 'MarketingArchetype',
    metaTag: 'MarketingArchetype',
  }),
  seedNode('marketing-scoring-1', 'Scoring', 'scoring', 5, 0, {
    subtype: 'initial',
  }),
  seedNode('marketing-editor', 'Editor', 'editor', 6, 0),
  seedNode('marketing-scoring-2', 'Scoring', 'scoring', 7, 0, {
    subtype: 'rescore',
  }),
  seedNode('marketing-delivery', 'Delivery', 'delivery', 8, 0),
];

// Closed-loop marketing: brand + ICP fan out to both generators; scoring's
// REPORT feeds the editor (action items drive the edit decision); composition
// feeds editor as source video; rescore loops back to editor on dependency.
const MARKETING_EDGES: GraphEdgeMeta[] = [
  dataflow('marketing-e1', 'marketing-brandkb', 'marketing-videogen-hero'),
  dataflow('marketing-e2', 'marketing-brandkb', 'marketing-videogen-broll'),
  dataflow('marketing-e3', 'marketing-brandkb', 'marketing-audiogen'),
  dataflow('marketing-e4', 'marketing-icp', 'marketing-videogen-hero'),
  dataflow('marketing-e5', 'marketing-icp', 'marketing-videogen-broll'),
  dataflow('marketing-e6', 'marketing-icp', 'marketing-audiogen'),
  dataflow('marketing-e7', 'marketing-videogen-hero', 'marketing-composition'),
  dataflow('marketing-e8', 'marketing-videogen-broll', 'marketing-composition'),
  dataflow('marketing-e9', 'marketing-audiogen', 'marketing-composition'),
  dataflow('marketing-e10', 'marketing-composition', 'marketing-scoring-1'),
  // Closed-loop: report + source video flow into editor
  dataflow('marketing-e11', 'marketing-scoring-1', 'marketing-editor'),
  dataflow('marketing-e12', 'marketing-composition', 'marketing-editor'),
  dataflow('marketing-e13', 'marketing-editor', 'marketing-scoring-2'),
  dataflow('marketing-e14', 'marketing-scoring-2', 'marketing-delivery'),
];

/** Knowledge: 3-iteration explainer. */
const KNOWLEDGE_NODES: GraphNodeMeta[] = [
  seedNode('knowledge-brandkb', 'Brand KB', 'brand_kb', 0, 0),
  seedNode('knowledge-icp', 'ICP', 'icp', 1, 0),
  seedNode('knowledge-videogen', 'Video Gen', 'video_gen', 2, 0, {
    subtype: 'explainer',
    metaTag: 'Explainer',
  }),
  seedNode('knowledge-audiogen', 'Audio Gen', 'audio_gen', 3, 0, {
    subtype: 'narration',
    metaTag: 'Long narration',
  }),
  seedNode('knowledge-composition', 'Composition', 'composition', 4, 0, {
    subtype: 'KnowledgeArchetype',
    metaTag: 'KnowledgeArchetype',
  }),
  seedNode('knowledge-scoring-1', 'Scoring', 'scoring', 5, 0, {
    subtype: 'iter-1',
  }),
  seedNode('knowledge-editor-1', 'Editor', 'editor', 6, 0, {
    subtype: 'iter-1',
  }),
  seedNode('knowledge-scoring-2', 'Scoring', 'scoring', 7, 0, {
    subtype: 'iter-2',
  }),
  seedNode('knowledge-editor-2', 'Editor', 'editor', 8, 0, {
    subtype: 'iter-2',
  }),
  seedNode('knowledge-scoring-3', 'Scoring', 'scoring', 9, 0, {
    subtype: 'iter-3',
  }),
  seedNode('knowledge-delivery', 'Delivery', 'delivery', 10, 0),
];

// Knowledge: 3 scoring/edit iterations, each editor takes both the prior
// iteration's video AND the scoring report (closed-loop per pass).
const KNOWLEDGE_EDGES: GraphEdgeMeta[] = [
  dataflow('knowledge-e1', 'knowledge-brandkb', 'knowledge-videogen'),
  dataflow('knowledge-e2', 'knowledge-brandkb', 'knowledge-audiogen'),
  dataflow('knowledge-e3', 'knowledge-icp', 'knowledge-videogen'),
  dataflow('knowledge-e4', 'knowledge-icp', 'knowledge-audiogen'),
  dataflow('knowledge-e5', 'knowledge-videogen', 'knowledge-composition'),
  dataflow('knowledge-e6', 'knowledge-audiogen', 'knowledge-composition'),
  dataflow('knowledge-e7', 'knowledge-composition', 'knowledge-scoring-1'),
  dataflow('knowledge-e8', 'knowledge-scoring-1', 'knowledge-editor-1'),
  dataflow('knowledge-e9', 'knowledge-composition', 'knowledge-editor-1'),
  dataflow('knowledge-e10', 'knowledge-editor-1', 'knowledge-scoring-2'),
  dataflow('knowledge-e11', 'knowledge-scoring-2', 'knowledge-editor-2'),
  dataflow('knowledge-e12', 'knowledge-editor-1', 'knowledge-editor-2'),
  dataflow('knowledge-e13', 'knowledge-editor-2', 'knowledge-scoring-3'),
  dataflow('knowledge-e14', 'knowledge-scoring-3', 'knowledge-delivery'),
];

/** Education: tutorial with lighter loop. */
const EDUCATION_NODES: GraphNodeMeta[] = [
  seedNode('education-brandkb', 'Brand KB', 'brand_kb', 0, 0),
  seedNode('education-icp', 'ICP', 'icp', 1, 0),
  seedNode('education-videogen-a', 'Video Gen', 'video_gen', 2, -1, {
    subtype: 'intro',
    metaTag: 'Intro segment',
  }),
  seedNode('education-videogen-b', 'Video Gen', 'video_gen', 2, 1, {
    subtype: 'lesson',
    metaTag: 'Lesson segment',
  }),
  seedNode('education-audiogen', 'Audio Gen', 'audio_gen', 3, 0, {
    subtype: 'instructor',
    metaTag: 'Instructor voice',
  }),
  seedNode('education-composition', 'Composition', 'composition', 4, 0, {
    subtype: 'EducationArchetype',
    metaTag: 'EducationArchetype',
  }),
  seedNode('education-scoring', 'Scoring', 'scoring', 5, 0),
  seedNode('education-delivery', 'Delivery', 'delivery', 6, 0),
];

const EDUCATION_EDGES: GraphEdgeMeta[] = [
  dataflow('education-e1', 'education-brandkb', 'education-videogen-a'),
  dataflow('education-e2', 'education-brandkb', 'education-videogen-b'),
  dataflow('education-e3', 'education-brandkb', 'education-audiogen'),
  dataflow('education-e4', 'education-icp', 'education-videogen-a'),
  dataflow('education-e5', 'education-icp', 'education-videogen-b'),
  dataflow('education-e6', 'education-icp', 'education-audiogen'),
  dataflow('education-e7', 'education-videogen-a', 'education-composition'),
  dataflow('education-e8', 'education-videogen-b', 'education-composition'),
  dataflow('education-e9', 'education-audiogen', 'education-composition'),
  dataflow('education-e10', 'education-composition', 'education-scoring'),
  dataflow('education-e11', 'education-scoring', 'education-delivery'),
];

export const ARCHETYPE_CONFIGS: Record<CampaignArchetype, ArchetypeConfig> = {
  demo: {
    id: 'demo',
    label: 'Demo',
    tagline: 'Product walkthrough',
    iconName: 'Sparkles',
    useCase: 'Narrated feature tour for launch pages and sales decks.',
    defaultNodes: DEMO_NODES,
    defaultEdges: annotateEdges(DEMO_NODES, DEMO_EDGES),
  },
  marketing: {
    id: 'marketing',
    label: 'Marketing',
    tagline: 'Hero ad with b-roll',
    iconName: 'Megaphone',
    useCase: 'Branching hero spot with voiceover for paid social.',
    defaultNodes: MARKETING_NODES,
    defaultEdges: annotateEdges(MARKETING_NODES, MARKETING_EDGES),
  },
  knowledge: {
    id: 'knowledge',
    label: 'Knowledge',
    tagline: 'Long-form explainer',
    iconName: 'BookOpen',
    useCase: 'Three-pass refinement for deep explainer content.',
    defaultNodes: KNOWLEDGE_NODES,
    defaultEdges: annotateEdges(KNOWLEDGE_NODES, KNOWLEDGE_EDGES),
  },
  education: {
    id: 'education',
    label: 'Education',
    tagline: 'Tutorial lesson',
    iconName: 'GraduationCap',
    useCase: 'Intro and lesson segments with a single scoring pass.',
    defaultNodes: EDUCATION_NODES,
    defaultEdges: annotateEdges(EDUCATION_NODES, EDUCATION_EDGES),
  },
};
