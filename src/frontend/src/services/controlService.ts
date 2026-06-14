import api from './apiClient'

export interface Control {
  id: string
  title: string
  description?: string
  category: string
  type: 'preventive' | 'detective' | 'corrective' | 'directive'
  status: 'active' | 'inactive' | 'draft' | 'review' | 'archived'
  effectiveness: 'high' | 'medium' | 'low' | 'not_rated'
  owner: string
  department: string
  riskIds?: string[]
  lastTested?: string
  nextTestDue?: string
  notes?: string
  createdAt: string
}

class ControlService {
  async getControls(params?: { status?: string; department?: string; type?: string }): Promise<Control[]> {
    const response = await api.get<{ data: Control[] }>('/controls', { params })
    return response.data.data || response.data as any
  }

  async getControlById(id: string): Promise<Control> {
    const response = await api.get<{ data: Control }>(`/controls/${id}`)
    return response.data.data || response.data as any
  }

  async createControl(control: Omit<Control, 'id' | 'createdAt'>): Promise<Control> {
    const response = await api.post<{ data: Control }>('/controls', control)
    return response.data.data || response.data as any
  }

  async updateControl(id: string, control: Partial<Control>): Promise<Control> {
    const response = await api.put<{ data: Control }>(`/controls/${id}`, control)
    return response.data.data || response.data as any
  }

  async deleteControl(id: string): Promise<void> {
    await api.delete(`/controls/${id}`)
  }

  async getControlSummary(): Promise<{ total: number; active: number; inactive: number; highEffectiveness: number }> {
    try {
      const response = await api.get<{ data: any }>('/controls/summary')
      return response.data.data || response.data as any
    } catch {
      const controls = await this.getControls()
      return {
        total: controls.length,
        active: controls.filter(c => c.status === 'active').length,
        inactive: controls.filter(c => c.status === 'inactive' || c.status === 'archived').length,
        highEffectiveness: controls.filter(c => c.effectiveness === 'high').length,
      }
    }
  }
}

export const controlService = new ControlService()
