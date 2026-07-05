import api from './apiClient'

export interface ComplianceItem {
  id: string
  title: string
  description?: string
  regulationSource?: string
  regulationSection?: string
  category: string
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed' | 'under_review'
  department: string
  ownerId?: string
  owner?: { id: string; firstName: string; lastName: string; email: string } | string
  priority?: 'critical' | 'high' | 'medium' | 'low'
  effectiveDate?: string
  reviewFrequency?: string
  lastReviewedAt?: string
  nextReviewDate?: string
  penaltyForNonCompliance?: string
  supportingDocuments?: string[]
  tags?: string[]
  metadata?: Record<string, any>
  createdBy?: string
  organisationId?: string
  createdAt: string
  updatedAt?: string
}

export interface ComplianceSummary {
  total: number
  compliant: number
  nonCompliant: number
  partial: number
  notAssessed: number
  underReview: number
  overallScore: number
}

class ComplianceService {
  async getComplianceItems(params?: { status?: string; department?: string; regulation?: string }): Promise<ComplianceItem[]> {
    const response = await api.get<{ data: ComplianceItem[] }>('/compliance', { params })
    return response.data.data || (response.data as any)
  }

  async getComplianceById(id: string): Promise<ComplianceItem> {
    const response = await api.get<{ data: ComplianceItem }>(`/compliance/${id}`)
    return response.data.data || (response.data as any)
  }

  async createComplianceItem(item: Omit<ComplianceItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceItem> {
    const response = await api.post<{ data: ComplianceItem }>('/compliance', item)
    return response.data.data || (response.data as any)
  }

  async updateComplianceItem(id: string, item: Partial<ComplianceItem>): Promise<ComplianceItem> {
    const response = await api.put<{ data: ComplianceItem }>(`/compliance/${id}`, item)
    return response.data.data || (response.data as any)
  }

  async deleteComplianceItem(id: string): Promise<void> {
    await api.delete(`/compliance/${id}`)
  }

  async getComplianceSummary(): Promise<ComplianceSummary> {
    try {
      const response = await api.get<{ data: ComplianceSummary }>('/compliance/summary')
      return response.data.data || (response.data as any)
    } catch {
      const items = await this.getComplianceItems()
      const compliant = items.filter(i => i.status === 'compliant').length
      return {
        total: items.length,
        compliant,
        nonCompliant: items.filter(i => i.status === 'non_compliant').length,
        partial: items.filter(i => i.status === 'partial').length,
        notAssessed: items.filter(i => i.status === 'not_assessed').length,
        underReview: items.filter(i => i.status === 'under_review').length,
        overallScore: items.length > 0 ? Math.round((compliant / items.length) * 100) : 0,
      }
    }
  }

  async getComplianceTrends(): Promise<{ name: string; compliant: number; nonCompliant: number }[]> {
    try {
      const response = await api.get<{ data: any[] }>('/compliance/trends')
      return response.data.data || (response.data as any)
    } catch {
      return []
    }
  }
}

export const complianceService = new ComplianceService()
