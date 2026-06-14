import api from './apiClient'

export interface ComplianceItem {
  id: string
  title: string
  description?: string
  regulation: string
  status: 'compliant' | 'non_compliant' | 'in_progress' | 'pending_review' | 'not_applicable'
  department: string
  owner: string
  dueDate?: string
  evidenceUrl?: string
  lastReviewed: string
  notes?: string
  createdAt: string
}

export interface ComplianceSummary {
  total: number
  compliant: number
  nonCompliant: number
  inProgress: number
  pendingReview: number
  overallRate: number
}

class ComplianceService {
  async getComplianceItems(params?: { status?: string; department?: string; regulation?: string }): Promise<ComplianceItem[]> {
    const response = await api.get<{ data: ComplianceItem[] }>('/compliance', { params })
    return response.data.data || response.data as any
  }

  async getComplianceById(id: string): Promise<ComplianceItem> {
    const response = await api.get<{ data: ComplianceItem }>(`/compliance/${id}`)
    return response.data.data || response.data as any
  }

  async createComplianceItem(item: Omit<ComplianceItem, 'id' | 'createdAt'>): Promise<ComplianceItem> {
    const response = await api.post<{ data: ComplianceItem }>('/compliance', item)
    return response.data.data || response.data as any
  }

  async updateComplianceItem(id: string, item: Partial<ComplianceItem>): Promise<ComplianceItem> {
    const response = await api.put<{ data: ComplianceItem }>(`/compliance/${id}`, item)
    return response.data.data || response.data as any
  }

  async deleteComplianceItem(id: string): Promise<void> {
    await api.delete(`/compliance/${id}`)
  }

  async getComplianceSummary(): Promise<ComplianceSummary> {
    try {
      const response = await api.get<{ data: ComplianceSummary }>('/compliance/summary')
      return response.data.data || response.data as any
    } catch {
      const items = await this.getComplianceItems()
      const compliant = items.filter(i => i.status === 'compliant').length
      return {
        total: items.length,
        compliant,
        nonCompliant: items.filter(i => i.status === 'non_compliant').length,
        inProgress: items.filter(i => i.status === 'in_progress').length,
        pendingReview: items.filter(i => i.status === 'pending_review').length,
        overallRate: items.length > 0 ? Math.round((compliant / items.length) * 100) : 0,
      }
    }
  }

  async getComplianceTrends(): Promise<{ name: string; compliant: number; nonCompliant: number }[]> {
    try {
      const response = await api.get<{ data: any[] }>('/compliance/trends')
      return response.data.data || response.data as any
    } catch {
      return []
    }
  }
}

export const complianceService = new ComplianceService()
