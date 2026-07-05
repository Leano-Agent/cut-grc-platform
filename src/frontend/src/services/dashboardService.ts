import { riskService } from './riskService'
import { complianceService } from './complianceService'
import { auditService } from './auditService'
import api from './apiClient'

export interface DashboardStats {
  totalRisks: number
  riskChange: string
  complianceRate: number
  complianceChange: string
  openAudits: number
  auditChange: string
  activeUsers: number
  userChange: string
}

export interface ActivityItem {
  id: number | string
  user: string
  action: string
  module: string
  time: string
  avatar?: string
}

export interface RiskTrend {
  name: string
  high: number
  medium: number
  low: number
}

export interface ComplianceQuarter {
  name: string
  compliant: number
  nonCompliant: number
}

export interface AuditPie {
  name: string
  value: number
  color: string
}

class DashboardService {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get<{ data: DashboardStats }>('/dashboard/stats')
      return response.data.data || response.data as any
    } catch {
      // Aggregate from individual services
      const [riskSummary, complianceSummary, auditSummary] = await Promise.all([
        riskService.getRiskSummary(),
        complianceService.getComplianceSummary(),
        auditService.getAuditSummary(),
      ])

      return {
        totalRisks: riskSummary.total,
        riskChange: riskSummary.high > 0 ? `+${riskSummary.high}` : '0',
        complianceRate: complianceSummary.overallScore,
        complianceChange: complianceSummary.overallScore > 0 ? `+${complianceSummary.overallScore - 80}` : '0',
        openAudits: auditSummary.inProgress + auditSummary.planned,
        auditChange: auditSummary.overdue > 0 ? `-${auditSummary.overdue}` : '0',
        activeUsers: 0, // Will be populated when user service connects
        userChange: '0',
      }
    }
  }

  async getRiskTrends(): Promise<RiskTrend[]> {
    try {
      const response = await api.get<{ data: RiskTrend[] }>('/dashboard/risk-trends')
      return response.data.data || response.data as any
    } catch {
      return []
    }
  }

  async getComplianceQuarters(): Promise<ComplianceQuarter[]> {
    try {
      const response = await api.get<{ data: ComplianceQuarter[] }>('/dashboard/compliance-trends')
      return response.data.data || response.data as any
    } catch {
      return []
    }
  }

  async getAuditStatus(): Promise<AuditPie[]> {
    try {
      const response = await api.get<{ data: AuditPie[] }>('/dashboard/audit-status')
      return response.data.data || response.data as any
    } catch {
      return []
    }
  }

  async getRecentActivities(): Promise<ActivityItem[]> {
    try {
      const response = await api.get<{ data: ActivityItem[] }>('/dashboard/activities')
      return response.data.data || response.data as any
    } catch {
      return []
    }
  }
}

export const dashboardService = new DashboardService()
