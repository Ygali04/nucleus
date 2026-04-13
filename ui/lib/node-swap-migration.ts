import type { GraphNodeKind } from '@/lib/types';

type Data = Record<string, unknown>;

type MigrationFn = (data: Data) => Data;

function pickPreserved(data: Data): Data {
  const out: Data = {};
  if ('label' in data) out.label = data.label;
  if ('statusText' in data) out.statusText = data.statusText;
  return out;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

const TABLE: Partial<Record<`${GraphNodeKind}->${GraphNodeKind}`, MigrationFn>> =
  {
    'video_gen->editor': (d) => ({
      ...pickPreserved(d),
      edit_prompt: str(d.prompt) ?? str(d.edit_prompt) ?? '',
    }),
    'editor->video_gen': (d) => ({
      ...pickPreserved(d),
      prompt: str(d.edit_prompt) ?? str(d.prompt) ?? '',
    }),
    'editor->audio_gen': (d) => ({
      ...pickPreserved(d),
      script: str(d.edit_prompt) ?? str(d.prompt) ?? '',
    }),
    'audio_gen->editor': (d) => ({
      ...pickPreserved(d),
      edit_prompt: str(d.script) ?? str(d.prompt) ?? '',
    }),
    'video_gen->audio_gen': (d) => ({
      ...pickPreserved(d),
      script: str(d.prompt) ?? '',
    }),
    'audio_gen->video_gen': (d) => ({
      ...pickPreserved(d),
      prompt: str(d.script) ?? '',
    }),
    'scoring->delivery': (d) => pickPreserved(d),
    'delivery->scoring': (d) => pickPreserved(d),
  };

export function migrateNodeData(
  fromKind: GraphNodeKind,
  toKind: GraphNodeKind,
  data: unknown,
): Data {
  const source: Data =
    data && typeof data === 'object' ? (data as Data) : {};
  if (fromKind === toKind) return { ...source };
  const fn = TABLE[`${fromKind}->${toKind}`];
  if (fn) return fn(source);
  return {
    ...pickPreserved(source),
    _migrated_from: { kind: fromKind, data: source },
  };
}
