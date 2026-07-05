import api from './apiClient'

export interface Risk {
  id: string
  title: string
  description?: string
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  likelihood: 'certain' | 'likely' | 'possible' | 'unlikely' | 'rare'
  riskScore?: number
  status: 'identified' | 'assessed' | 'in_treatment' | 'monitoring' | 'closed' | 'archived'
  department: string
  ownerId?: string
  owner?: { id: string; firstName: string; lastName: string; email: string } | string
  source?: string
  impactDescription?: string
  rootCause?: string
  existingControls?: string
  treatmentStrategy?: 'accept' | 'mitigate' | 'transfer' | 'avoid' | 'monitor'
  residualSeverity?: 'critical' | 'high' | 'medium' | 'low'
  residualLikelihood?: 'certain' | 'likely' | 'possible' | 'unlikely' | 'rare'
  targetDate?: string
  closedAt?: string
  tags?: string[]
  metadata?: Record<string, any>
  createdBy?: string
  organisationId?: string
  createdAt: string
  updatedAt: string
}

export interface RiskSummary {
  total: number
  high: number
  medium: number
  low: number
  critical: number
  open: number
  mitigated: number
}

// Map from backend status to display-friendly status for the existing page
export const RISK_STATUS_MAP: Record<string, string> = {
  identified: 'open',
  assessed: 'in_review',
  in_treatment: 'in_progress',
  monitoring: 'in_progress',
  closed: 'closed',
  archived: 'closed',
}

export const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const LIKELIHOOD_LABELS: Record<string, string> = {
  certain: 'Certain',
  likely: 'Likely',
  possible: 'Possible',
  unlikely: 'Unlikely',
  rare: 'Rare',
}

class RiskService {
  async getRisks(params?: { status?: string; department?: string; search?: string }): Promise<Risk[]> {
    const response = await api.get<{ data: Risk[] }>('/risks', { params })
    return response.data.data || (response.data as any)
  }

  async getRiskById(id: string): Promise<Risk> {
    const response = await api.get<{ data: Risk }>(`/risks/${id}`)
    return response.data.data || (response.data as any)
  }

  async createRisk(risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt' | 'riskScore'>): Promise<Risk> {
    const response = await api.post<{ data: Risk }>('/risks', risk)
    return response.data.data || (response.data as any)
  }

  async updateRisk(id: string, risk: Partial<Risk>): Promise<Risk> {
    const response = await api.put<{ data: Risk }>(`/risks/${id}`, risk)
    return response.data.data || (response.data as any)
  }

  async deleteRisk(id: string): Promise<void> {
    await api.delete(`/risks/${id}`)
  }

  async getRiskSummary(): Promise<RiskSummary> {
    try {
      const response = await api.get<{ data: RiskSummary }>('/risks/summary')
      return response.data.data || (response.data as any)
    } catch {
      const risks = await this.getRisks()
      return {
        total: risks.length,
        critical: risks.filter(r => r.severity === 'critical').length,
        high: risks.filter(r => r.severity === 'high').length,
        medium: risks.filter(r => r.severity === 'medium').length,
        low: risks.filter(r => r.severity === 'low').length,
        open: risks.filter(r => r.status === 'identified' || r.status === 'assessed' || r.status === 'in_treatment' || r.status === 'monitoring').length,
        mitigated: risks.filter(r => r.status === 'closed' || r.status === 'archived').length,
      }
    }
  }

  async getRiskTrends(): Promise<{ name: string; high: number; medium: number; low: number }[]> {
    try {
      const response = await api.get<{ data: any[] }>('/risks/trends')
      return response.data.data || (response.data as any)
    } catch {
      return []
    }
  }
}

export const riskService = new RiskService()
