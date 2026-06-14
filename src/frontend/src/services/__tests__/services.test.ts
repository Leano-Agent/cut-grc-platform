/**
 * Service Integration Tests
 * Tests the API client and all service modules with mocked Axios
 */
import axios from 'axios'
import apiClient from '@services/apiClient'
import {
  getRisks,
  getRiskById,
  createRisk,
  updateRisk,
  deleteRisk,
  getRiskSummary,
  getRiskTrends,
} from '@services/riskService'
import {
  getComplianceItems,
  getComplianceItemById,
  updateComplianceItem,
  getComplianceSummary,
  getComplianceTrends,
} from '@services/complianceService'
import {
  getControls,
  getControlById,
  createControl,
  updateControl,
  deleteControl,
  getControlSummary,
} from '@services/controlService'
import {
  getAudits,
  getAuditById,
  createAudit,
  updateAudit,
  deleteAudit,
  getAuditSummary,
  getAuditFindings,
} from '@services/auditService'
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '@services/userService'
import { getDashboardData } from '@services/dashboardService'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  test('creates axios instance with correct base URL', () => {
    expect(axios.create).toHaveBeenCalled()
    const instance = apiClient
    expect(instance).toBeDefined()
  })

  test('attaches auth token to requests when token exists', async () => {
    // We need to access the interceptor directly
    // The token is set via localStorage.getItem('token')
    localStorage.setItem('token', 'test-jwt-token')

    // Verify the request interceptor adds the header
    mockedAxios.get.mockResolvedValueOnce({ data: { success: true } })
    await apiClient.get('/test')
    expect(mockedAxios.get).toHaveBeenCalled()
    // The interceptor should have added the Authorization header
    const config = mockedAxios.get.mock.calls[0][1]
    expect(config?.headers?.Authorization).toBe('Bearer test-jwt-token')
  })
})

describe('riskService', () => {
  beforeEach(() => jest.clearAllMocks())

  test('getRisks calls GET /risks', async () => {
    const mockRisks = [{ id: '1', title: 'Risk 1', riskLevel: 'High', status: 'Open' }]
    mockedAxios.get.mockResolvedValueOnce({ data: { data: mockRisks } })

    const result = await getRisks()
    expect(mockedAxios.get).toHaveBeenCalledWith('/risks')
    expect(result).toEqual(mockRisks)
  })

  test('getRiskById calls GET /risks/:id', async () => {
    const mockRisk = { id: '1', title: 'Risk 1' }
    mockedAxios.get.mockResolvedValueOnce({ data: { data: mockRisk } })

    const result = await getRiskById('1')
    expect(mockedAxios.get).toHaveBeenCalledWith('/risks/1')
    expect(result).toEqual(mockRisk)
  })

  test('createRisk calls POST /risks with data', async () => {
    const newRisk = { title: 'New Risk', description: 'Test', riskLevel: 'Medium', status: 'Open' }
    const created = { id: '3', ...newRisk }
    mockedAxios.post.mockResolvedValueOnce({ data: { data: created } })

    const result = await createRisk(newRisk)
    expect(mockedAxios.post).toHaveBeenCalledWith('/risks', newRisk)
    expect(result).toEqual(created)
  })

  test('updateRisk calls PUT /risks/:id with data', async () => {
    const updates = { title: 'Updated Risk', riskLevel: 'High' }
    mockedAxios.put.mockResolvedValueOnce({ data: { data: { id: '1', ...updates } } })

    const result = await updateRisk('1', updates)
    expect(mockedAxios.put).toHaveBeenCalledWith('/risks/1', updates)
    expect(result).toEqual({ id: '1', ...updates })
  })

  test('deleteRisk calls DELETE /risks/:id', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: { success: true } })

    await deleteRisk('1')
    expect(mockedAxios.delete).toHaveBeenCalledWith('/risks/1')
  })

  test('getRiskSummary calls GET /risks/summary', async () => {
    const summary = { total: 10, high: 3, medium: 4, low: 3 }
    mockedAxios.get.mockResolvedValueOnce({ data: { data: summary } })

    const result = await getRiskSummary()
    expect(mockedAxios.get).toHaveBeenCalledWith('/risks/summary')
    expect(result).toEqual(summary)
  })

  test('getRiskTrends calls GET /risks/trends', async () => {
    const trends = { monthly: [{ month: 'Jan', count: 5 }] }
    mockedAxios.get.mockResolvedValueOnce({ data: { data: trends } })

    const result = await getRiskTrends()
    expect(mockedAxios.get).toHaveBeenCalledWith('/risks/trends')
    expect(result).toEqual(trends)
  })
})

describe('complianceService', () => {
  beforeEach(() => jest.clearAllMocks())

  test('getComplianceItems calls GET /compliance', async () => {
    const items = [{ id: '1', title: 'POPIA', status: 'Compliant' }]
    mockedAxios.get.mockResolvedValueOnce({ data: { data: items } })

    const result = await getComplianceItems()
    expect(mockedAxios.get).toHaveBeenCalledWith('/compliance')
    expect(result).toEqual(items)
  })

  test('getComplianceSummary calls GET /compliance/summary', async () => {
    const summary = { total: 10, compliant: 7, nonCompliant: 2, inProgress: 1 }
    mockedAxios.get.mockResolvedValueOnce({ data: { data: summary } })

    const result = await getComplianceSummary()
    expect(mockedAxios.get).toHaveBeenCalledWith('/compliance/summary')
    expect(result).toEqual(summary)
  })

  test('updateComplianceItem calls PUT /compliance/:id', async () => {
    const updates = { status: 'Non-Compliant' }
    mockedAxios.put.mockResolvedValueOnce({ data: { data: { id: '1', ...updates } } })

    const result = await updateComplianceItem('1', updates)
    expect(mockedAxios.put).toHaveBeenCalledWith('/compliance/1', updates)
    expect(result).toEqual({ id: '1', ...updates })
  })
})

describe('controlService', () => {
  beforeEach(() => jest.clearAllMocks())

  test('getControls calls GET /controls', async () => {
    const controls = [{ id: '1', title: 'Firewall', status: 'Active' }]
    mockedAxios.get.mockResolvedValueOnce({ data: { data: controls } })

    const result = await getControls()
    expect(mockedAxios.get).toHaveBeenCalledWith('/controls')
    expect(result).toEqual(controls)
  })

  test('getControlById calls GET /controls/:id', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { data: { id: '1' } } })
    await getControlById('1')
    expect(mockedAxios.get).toHaveBeenCalledWith('/controls/1')
  })

  test('createControl calls POST /controls', async () => {
    const newControl = { title: 'New Control', description: 'test', effectiveness: 'high', status: 'Active' }
    mockedAxios.post.mockResolvedValueOnce({ data: { data: { id: '2', ...newControl } } })
    await createControl(newControl)
    expect(mockedAxios.post).toHaveBeenCalledWith('/controls', newControl)
  })

  test('getControlSummary calls GET /controls/summary', async () => {
    const summary = { total: 5, active: 3, inactive: 2 }
    mockedAxios.get.mockResolvedValueOnce({ data: { data: summary } })
    const result = await getControlSummary()
    expect(mockedAxios.get).toHaveBeenCalledWith('/controls/summary')
    expect(result).toEqual(summary)
  })
})

describe('auditService', () => {
  beforeEach(() => jest.clearAllMocks())

  test('getAudits calls GET /audits', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ id: '1', title: 'Q1 Audit' }] } })
    const result = await getAudits()
    expect(mockedAxios.get).toHaveBeenCalledWith('/audits')
    expect(result).toHaveLength(1)
  })

  test('getAuditFindings calls GET /audits/:id/findings', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ id: 'f1', severity: 'high' }] } })
    const result = await getAuditFindings('1')
    expect(mockedAxios.get).toHaveBeenCalledWith('/audits/1/findings')
    expect(result).toHaveLength(1)
  })

  test('getAuditSummary calls GET /audits/summary', async () => {
    const summary = { total: 3, completed: 1, inProgress: 1, planned: 1 }
    mockedAxios.get.mockResolvedValueOnce({ data: { data: summary } })
    const result = await getAuditSummary()
    expect(mockedAxios.get).toHaveBeenCalledWith('/audits/summary')
    expect(result).toEqual(summary)
  })
})

describe('userService', () => {
  beforeEach(() => jest.clearAllMocks())

  test('getUsers calls GET /users', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ id: '1', email: 'admin@cut.ac.za' }] } })
    const result = await getUsers()
    expect(mockedAxios.get).toHaveBeenCalledWith('/users')
    expect(result).toHaveLength(1)
  })

  test('createUser calls POST /users', async () => {
    const user = { email: 'new@cut.ac.za', firstName: 'Test', lastName: 'User', role: 'user' }
    mockedAxios.post.mockResolvedValueOnce({ data: { data: { id: '2', ...user } } })
    await createUser(user)
    expect(mockedAxios.post).toHaveBeenCalledWith('/users', user)
  })
})

describe('dashboardService', () => {
  beforeEach(() => jest.clearAllMocks())

  test('getDashboardData aggregates data from all services', async () => {
    // Mock all service endpoints
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/risks/summary') return Promise.resolve({ data: { data: { total: 10, high: 3, medium: 4, low: 3 } } })
      if (url === '/compliance/summary') return Promise.resolve({ data: { data: { total: 10, compliant: 7, nonCompliant: 2, inProgress: 1 } } })
      if (url === '/controls/summary') return Promise.resolve({ data: { data: { total: 5, active: 3, inactive: 2 } } })
      if (url === '/audits/summary') return Promise.resolve({ data: { data: { total: 3, completed: 1, inProgress: 1, planned: 1 } } })
      if (url === '/risks/trends') return Promise.resolve({ data: { data: { monthly: [{ month: 'Jan', count: 5 }] } } })
      if (url === '/compliance/trends') return Promise.resolve({ data: { data: { monthly: [{ month: 'Jan', compliant: 7 }] } } })
      return Promise.reject(new Error('Unknown endpoint'))
    })

    const result = await getDashboardData()
    expect(result).toHaveProperty('riskSummary')
    expect(result).toHaveProperty('complianceSummary')
    expect(result).toHaveProperty('controlSummary')
    expect(result).toHaveProperty('auditSummary')
    expect(result).toHaveProperty('riskTrends')
    expect(result).toHaveProperty('complianceTrends')
  })

  test('getDashboardData falls back gracefully when services fail', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

    const result = await getDashboardData()
    // Should return default empty values instead of crashing
    expect(result).toHaveProperty('riskSummary')
    expect(result.riskSummary).toEqual({ total: 0, high: 0, medium: 0, low: 0, critical: 0 })
  })
})
