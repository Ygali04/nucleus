import type { PipelineCandidate, PipelineJob } from '@/store/pipeline-store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface SubmitBriefResponse {
  job_id: string;
  websocket_url: string;
  candidate_count: number;
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
}

export const apiClient = new NucleusAPIClient();
