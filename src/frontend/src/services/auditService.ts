import api from './apiClient'

export interface Audit {
  id: string
  title: string
  description?: string
  type: 'internal' | 'external' | 'compliance' | 'financial' | 'operational'
  status: 'planned' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  scope: string
  department: string
  auditor: string
  auditee: string
  scheduledStart: string
  scheduledEnd: string
  actualStart?: string
  actualEnd?: string
  findings?: number
  recommendations?: number
  reportUrl?: string
  createdAt: string
}

export interface AuditSummary {
  total: number
  completed: number
  inProgress: number
  planned: number
  overdue: number
}

class AuditService {
  async getAudits(params?: { status?: string; department?: string; type?: string }): Promise<Audit[]> {
    const response = await api.get<{ data: Audit[] }>('/audits', { params })
    return response.data.data || response.data as any
  }

  async getAuditById(id: string): Promise<Audit> {
    const response = await api.get<{ data: Audit }>(`/audits/${id}`)
    return response.data.data || response.data as any
  }

  async createAudit(audit: Omit<Audit, 'id' | 'createdAt'>): Promise<Audit> {
    const response = await api.post<{ data: Audit }>('/audits', audit)
    return response.data.data || response.data as any
  }

  async updateAudit(id: string, audit: Partial<Audit>): Promise<Audit> {
    const response = await api.put<{ data: Audit }>(`/audits/${id}`, audit)
    return response.data.data || response.data as any
  }

  async deleteAudit(id: string): Promise<void> {
    await api.delete(`/audits/${id}`)
  }

  async getAuditSummary(): Promise<AuditSummary> {
    try {
      const response = await api.get<{ data: AuditSummary }>('/audits/summary')
      return response.data.data || response.data as any
    } catch {
      const audits = await this.getAudits()
      return {
        total: audits.length,
        completed: audits.filter(a => a.status === 'completed').length,
        inProgress: audits.filter(a => a.status === 'in_progress').length,
        planned: audits.filter(a => a.status === 'planned').length,
        overdue: audits.filter(a => a.status === 'overdue').length,
      }
    }
  }
}

export const auditService = new AuditService()
