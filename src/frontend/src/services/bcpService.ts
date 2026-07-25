import apiClient from './apiClient'

export interface CriticalFunction {
  name: string
  rto: number
  rpo: number
  priority: number
}

export interface RecoveryProcedure {
  step: number
  description: string
  owner: string
  duration: string
}

export interface TestSchedule {
  frequency: string
  lastTestDate: string | null
  nextTestDate: string | null
  lastTestResult: string | null
}

export interface TestRecord {
  date: string
  type: string
  result: string
  notes: string | null
  participants: string[]
}

export interface Stakeholder {
  name: string
  role: string
  contact: string
  department: string
}

export interface BcpPlan {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  department: string | null
  owner: string | null
  scope: string | null
  objectives: string | null
  criticalFunctions: CriticalFunction[]
  recoveryProcedures: RecoveryProcedure[]
  testSchedule: TestSchedule
  testHistory: TestRecord[]
  stakeholders: Stakeholder[]
  relatedIncidents: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface BcpStats {
  total: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  testedCount: number
  expiringSoon: number
  approved: number
  needsReview: number
  draft: number
}

export interface BcpFormData {
  name: string
  description?: string
  type: string
  department?: string
  owner?: string
  scope?: string
  objectives?: string
  criticalFunctions?: CriticalFunction[]
  recoveryProcedures?: RecoveryProcedure[]
  stakeholders?: Stakeholder[]
  tags?: string[]
}

const bcpService = {
  getAll: async (filters?: { type?: string; status?: string; department?: string; search?: string }): Promise<BcpPlan[]> => {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.department) params.append('department', filters.department)
    if (filters?.search) params.append('search', filters.search)
    const query = params.toString()
    const response = await apiClient.get(`/api/v1/bcp${query ? `?${query}` : ''}`)
    return response.data
  },

  getById: async (id: string): Promise<BcpPlan> => {
    const response = await apiClient.get(`/api/v1/bcp/${id}`)
    return response.data
  },

  create: async (data: BcpFormData): Promise<BcpPlan> => {
    const response = await apiClient.post('/api/v1/bcp', data)
    return response.data
  },

  update: async (id: string, data: Partial<BcpFormData>): Promise<BcpPlan> => {
    const response = await apiClient.put(`/api/v1/bcp/${id}`, data)
    return response.data
  },

  updateStatus: async (id: string, status: string): Promise<BcpPlan> => {
    const response = await apiClient.patch(`/api/v1/bcp/${id}/status`, { status })
    return response.data
  },

  recordTest: async (id: string, testData: { type: string; result: string; notes?: string; participants?: string[] }): Promise<BcpPlan> => {
    const response = await apiClient.post(`/api/v1/bcp/${id}/test`, testData)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/bcp/${id}`)
  },

  getStats: async (): Promise<BcpStats> => {
    const response = await apiClient.get('/api/v1/bcp/stats/summary')
    return response.data
  },

  types: [
    { value: 'bcp', label: 'Business Continuity Plan' },
    { value: 'drp', label: 'Disaster Recovery Plan' },
    { value: 'crisis_plan', label: 'Crisis Management Plan' },
    { value: 'pandemic_plan', label: 'Pandemic Response Plan' },
  ] as { value: string; label: string }[],

  statuses: [
    { value: 'draft', label: 'Draft', color: '#9e9e9e' },
    { value: 'reviewed', label: 'Reviewed', color: '#2196f3' },
    { value: 'approved', label: 'Approved', color: '#4caf50' },
    { value: 'tested', label: 'Tested', color: '#ff9800' },
    { value: 'expired', label: 'Expired', color: '#f44336' },
  ] as { value: string; label: string; color: string }[],

  testTypes: [
    { value: 'tabletop', label: 'Tabletop Exercise' },
    { value: 'walkthrough', label: 'Walkthrough' },
    { value: 'simulation', label: 'Simulation' },
    { value: 'full_failover', label: 'Full Failover Test' },
    { value: 'exercise', label: 'Exercise' },
    { value: 'audit', label: 'Audit Review' },
  ] as { value: string; label: string }[],

  testResults: [
    { value: 'pass', label: 'Pass', color: '#4caf50' },
    { value: 'pass_with_issues', label: 'Pass with Issues', color: '#ff9800' },
    { value: 'fail', label: 'Fail', color: '#f44336' },
    { value: 'incomplete', label: 'Incomplete', color: '#9e9e9e' },
  ] as { value: string; label: string; color: string }[],

  getValidTransitions: (currentStatus: string): { value: string; label: string }[] => {
    const transitions: Record<string, string[]> = {
      draft: ['reviewed'],
      reviewed: ['approved', 'draft'],
      approved: ['tested', 'reviewed'],
      tested: ['approved', 'expired'],
      expired: ['draft'],
    }
    const labels: Record<string, string> = {
      reviewed: 'Submit for Review',
      approved: 'Approve Plan',
      draft: 'Return to Draft',
      tested: 'Mark as Tested',
      expired: 'Mark as Expired',
    }
    return (transitions[currentStatus] || []).map(v => ({ value: v, label: labels[v] || v }))
  },
}

export default bcpService
