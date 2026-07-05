import api from './apiClient'

export interface Control {
  id: string
  title: string
  description?: string
  controlType: 'preventive' | 'detective' | 'corrective' | 'directive' | 'compensating'
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'ad_hoc'
  status: 'draft' | 'active' | 'testing' | 'review' | 'inactive' | 'failed'
  department: string
  ownerId?: string
  owner?: { id: string; firstName: string; lastName: string; email: string } | string
  riskId?: string
  requirementId?: string
  designEffectiveness?: 'effective' | 'partially_effective' | 'ineffective' | 'not_designed'
  operationalEffectiveness?: 'effective' | 'partially_effective' | 'ineffective' | 'not_tested'
  lastTestedAt?: string
  nextTestDate?: string
  automationLevel?: 'manual' | 'semi_automated' | 'fully_automated'
  controlOwner?: string
  evidenceRequired?: boolean
  autoApprove?: boolean
  escalationThreshold?: number
  approvalRequired?: boolean
  tags?: string[]
  metadata?: Record<string, any>
  createdBy?: string
  organisationId?: string
  createdAt: string
  updatedAt?: string
}

export interface ControlSummary {
  total: number
  byStatus: Record<string, number>
  byDesignEffectiveness: Record<string, number>
}

class ControlService {
  async getControls(params?: { status?: string; department?: string; type?: string }): Promise<Control[]> {
    const response = await api.get<{ data: Control[] }>('/controls', { params })
    return response.data.data || (response.data as any)
  }

  async getControlById(id: string): Promise<Control> {
    const response = await api.get<{ data: Control }>(`/controls/${id}`)
    return response.data.data || (response.data as any)
  }

  async createControl(control: Omit<Control, 'id' | 'createdAt' | 'updatedAt'>): Promise<Control> {
    const response = await api.post<{ data: Control }>('/controls', control)
    return response.data.data || (response.data as any)
  }

  async updateControl(id: string, control: Partial<Control>): Promise<Control> {
    const response = await api.put<{ data: Control }>(`/controls/${id}`, control)
    return response.data.data || (response.data as any)
  }

  async deleteControl(id: string): Promise<void> {
    await api.delete(`/controls/${id}`)
  }

  async getControlSummary(): Promise<ControlSummary> {
    try {
      const response = await api.get<{ data: ControlSummary }>('/controls/summary')
      return response.data.data || (response.data as any)
    } catch {
      const controls = await this.getControls()
      return {
        total: controls.length,
        byStatus: {},
        byDesignEffectiveness: {},
      }
    }
  }
}

export const controlService = new ControlService()
