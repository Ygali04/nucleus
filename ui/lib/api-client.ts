import type { PipelineCandidate, PipelineJob } from '@/store/pipeline-store';
import type { GraphEdgeMeta, GraphNodeMeta } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface SubmitBriefResponse {
  job_id: string;
  websocket_url: string;
  candidate_count: number;
}

export interface CampaignGraph {
  nodes: GraphNodeMeta[];
  edges: GraphEdgeMeta[];
}

export interface Campaign {
  id: string;
  archetype: string;
  brand_name: string;
  graph: CampaignGraph;
  brief: Record<string, unknown> | null;
  status: string;
  created_at: string;
  updated_at: string;
  last_executed_at: string | null;
  last_job_id: string | null;
}

export interface CampaignCreate {
  archetype: string;
  brand_name: string;
  graph: CampaignGraph;
  brief?: Record<string, unknown> | null;
}

export interface CampaignPatch {
  archetype?: string;
  brand_name?: string;
  graph?: CampaignGraph;
  brief?: Record<string, unknown> | null;
  status?: string;
}

export interface CampaignExecuteResponse {
  job_id: string;
  websocket_url: string;
}

export interface CampaignReport {
  iteration_id: string;
  candidate_id: string;
  iteration_index: number;
  analysis_result: Record<string, unknown>;
}

export class NucleusAPIClient {
  constructor(private readonly baseUrl: string = BASE_URL) {}

  async submitBrief(brief: Record<string, unknown>): Promise<SubmitBriefResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/briefs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brief),
    });
    if (!res.ok) throw new Error(`submitBrief failed: ${res.status}`);
    return res.json() as Promise<SubmitBriefResponse>;
  }

  async getJob(jobId: string): Promise<PipelineJob> {
    const res = await fetch(`${this.baseUrl}/api/v1/jobs/${jobId}`);
    if (!res.ok) throw new Error(`getJob failed: ${res.status}`);
    return res.json() as Promise<PipelineJob>;
  }

  async getCandidates(jobId: string): Promise<PipelineCandidate[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/jobs/${jobId}/candidates`);
    if (!res.ok) throw new Error(`getCandidates failed: ${res.status}`);
    return res.json() as Promise<PipelineCandidate[]>;
  }

  async retryTool<T = unknown>(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api/v1/tools/${toolName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`retryTool ${toolName} failed: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async approveStep(approvalId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/approvals/${approvalId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`approveStep failed: ${res.status}`);
  }

  getWebSocketUrl(jobId: string): string {
    const wsBase = this.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${wsBase}/ws/job/${jobId}`;
  }

  async listCampaigns(): Promise<Campaign[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/campaigns`);
    if (!res.ok) throw new Error(`listCampaigns failed: ${res.status}`);
    return res.json() as Promise<Campaign[]>;
  }

  async getCampaign(id: string): Promise<Campaign> {
    const res = await fetch(`${this.baseUrl}/api/v1/campaigns/${id}`);
    if (!res.ok) throw new Error(`getCampaign failed: ${res.status}`);
    return res.json() as Promise<Campaign>;
  }

  async createCampaign(body: CampaignCreate): Promise<Campaign> {
    const res = await fetch(`${this.baseUrl}/api/v1/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`createCampaign failed: ${res.status}`);
    return res.json() as Promise<Campaign>;
  }

  async updateCampaign(id: string, patch: CampaignPatch): Promise<Campaign> {
    const res = await fetch(`${this.baseUrl}/api/v1/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`updateCampaign failed: ${res.status}`);
    return res.json() as Promise<Campaign>;
  }

  async deleteCampaign(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/campaigns/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`deleteCampaign failed: ${res.status}`);
    }
  }

  async executeCampaign(id: string): Promise<CampaignExecuteResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/campaigns/${id}/execute`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`executeCampaign failed: ${res.status}`);
    return res.json() as Promise<CampaignExecuteResponse>;
  }

  async sendChatMessage(campaignId: string, text: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/campaigns/${campaignId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    });
    if (!res.ok) throw new Error(`sendChatMessage failed: ${res.status}`);
  }

  async listCampaignReports(id: string): Promise<CampaignReport[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/campaigns/${id}/reports`);
    if (!res.ok) throw new Error(`listCampaignReports failed: ${res.status}`);
    return res.json() as Promise<CampaignReport[]>;
  }
}

export const apiClient = new NucleusAPIClient();
