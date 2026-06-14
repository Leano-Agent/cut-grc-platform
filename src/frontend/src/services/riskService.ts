import api from './apiClient'

export interface Risk {
  id: string
  title: string
  description?: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  likelihood: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'in_review' | 'closed' | 'mitigated'
  department: string
  assignedTo: string
  owner?: string
  mitigation?: string
  dueDate?: string
  lastUpdated?: string
  createdAt: string
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

class RiskService {
  async getRisks(params?: { status?: string; department?: string; search?: string }): Promise<Risk[]> {
    const response = await api.get<{ data: Risk[] }>('/risks', { params })
    return response.data.data || response.data as any
  }

  async getRiskById(id: string): Promise<Risk> {
    const response = await api.get<{ data: Risk }>(`/risks/${id}`)
    return response.data.data || response.data as any
  }

  async createRisk(risk: Omit<Risk, 'id' | 'createdAt'>): Promise<Risk> {
    const response = await api.post<{ data: Risk }>('/risks', risk)
    return response.data.data || response.data as any
  }

  async updateRisk(id: string, risk: Partial<Risk>): Promise<Risk> {
    const response = await api.put<{ data: Risk }>(`/risks/${id}`, risk)
    return response.data.data || response.data as any
  }

  async deleteRisk(id: string): Promise<void> {
    await api.delete(`/risks/${id}`)
  }

  async getRiskSummary(): Promise<RiskSummary> {
    try {
      const response = await api.get<{ data: RiskSummary }>('/risks/summary')
      return response.data.data || response.data as any
    } catch {
      // Fallback: calculate summary from all risks
      const risks = await this.getRisks()
      return {
        total: risks.length,
        critical: risks.filter(r => r.severity === 'critical').length,
        high: risks.filter(r => r.severity === 'high').length,
        medium: risks.filter(r => r.severity === 'medium').length,
        low: risks.filter(r => r.severity === 'low').length,
        open: risks.filter(r => r.status === 'open' || r.status === 'in_progress').length,
        mitigated: risks.filter(r => r.status === 'mitigated' || r.status === 'closed').length,
      }
    }
  }

  async getRiskTrends(): Promise<{ name: string; high: number; medium: number; low: number }[]> {
    try {
      const response = await api.get<{ data: any[] }>('/risks/trends')
      return response.data.data || response.data as any
    } catch {
      return [] // API not available yet
    }
  }
}

export const riskService = new RiskService()
