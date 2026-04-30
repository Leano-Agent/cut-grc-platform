/**
 * Municipal Workflow Service
 * API service for municipal workflow operations
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/municipal`;

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: number;
  steps: any[];
  defaultPriority: string;
  defaultSla?: {
    duration: number;
    warningThreshold: number;
    breachThreshold: number;
  };
  roles: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowInstance {
  id: string;
  workflowType: string;
  workflowId: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  currentStep: number;
  steps: any[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowAction {
  type: string;
  instanceId: string;
  stepId: string;
  action: string;
  performedBy: string;
  performedAt: string;
  comments?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  pendingAction: number;
}

export interface CreateWorkflowRequest {
  workflowId: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface PerformActionRequest {
  action: string;
  comments?: string;
  metadata?: Record<string, any>;
}

export interface FilterWorkflowsRequest {
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

class MunicipalWorkflowService {
  private axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== TEMPLATE MANAGEMENT ====================

  /**
   * Get all workflow templates
   */
  async getTemplates(): Promise<{
    templates: Record<string, WorkflowTemplate>;
    roles: Record<string, string>;
    categories: Record<string, string>;
  }> {
    const response = await this.axiosInstance.get('/workflows/templates');
    return response.data.data;
  }

  /**
   * Get specific workflow template
   */
  async getTemplate(workflowId: string): Promise<WorkflowTemplate> {
    const response = await this.axiosInstance.get(`/workflows/templates/${workflowId}`);
    return response.data.data;
  }

  // ==================== INSTANCE MANAGEMENT ====================

  /**
   * Create new workflow instance
   */
  async createInstance(data: CreateWorkflowRequest): Promise<WorkflowInstance> {
    const response = await this.axiosInstance.post('/workflows/instances', data);
    return response.data.data;
  }

  /**
   * Get workflow instances with filters
   */
  async getInstances(filters: FilterWorkflowsRequest = {}): Promise<{
    instances: WorkflowInstance[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await this.axiosInstance.get('/workflows/instances', { params });
    return response.data.data;
  }

  /**
   * Get workflow instance details
   */
  async getInstance(instanceId: string): Promise<{
    instance: WorkflowInstance;
    actions: WorkflowAction[];
    currentStep: any;
    template: WorkflowTemplate;
  }> {
    const response = await this.axiosInstance.get(`/workflows/instances/${instanceId}`);
    return response.data.data;
  }

  /**
   * Update workflow instance metadata
   */
  async updateMetadata(instanceId: string, metadata: Record<string, any>): Promise<WorkflowInstance> {
    const response = await this.axiosInstance.patch(`/workflows/instances/${instanceId}/metadata`, { metadata });
    return response.data.data;
  }

  /**
   * Pause workflow instance
   */
  async pauseInstance(instanceId: string): Promise<WorkflowInstance> {
    const response = await this.axiosInstance.post(`/workflows/instances/${instanceId}/pause`);
    return response.data.data;
  }

  /**
   * Resume workflow instance
   */
  async resumeInstance(instanceId: string): Promise<WorkflowInstance> {
    const response = await this.axiosInstance.post(`/workflows/instances/${instanceId}/resume`);
    return response.data.data;
  }

  /**
   * Cancel workflow instance
   */
  async cancelInstance(instanceId: string, reason?: string): Promise<WorkflowInstance> {
    const response = await this.axiosInstance.post(`/workflows/instances/${instanceId}/cancel`, { reason });
    return response.data.data;
  }

  // ==================== ACTIONS ====================

  /**
   * Perform action on workflow step
   */
  async performAction(
    instanceId: string,
    stepId: string,
    data: PerformActionRequest
  ): Promise<WorkflowInstance> {
    const response = await this.axiosInstance.post(
      `/workflows/instances/${instanceId}/actions/${stepId}`,
      data
    );
    return response.data.data;
  }

  /**
   * Get actions history for workflow instance
   */
  async getInstanceActions(instanceId: string): Promise<WorkflowAction[]> {
    const response = await this.axiosInstance.get(`/workflows/instances/${instanceId}/actions`);
    return response.data.data;
  }

  // ==================== DASHBOARD & REPORTS ====================

  /**
   * Get workflow dashboard data
   */
  async getDashboard(): Promise<{
    stats: WorkflowStats;
    recentInstances: WorkflowInstance[];
    attentionRequired: WorkflowInstance[];
    overdue: WorkflowInstance[];
    userRole: string;
  }> {
    const response = await this.axiosInstance.get('/workflows/dashboard');
    return response.data.data;
  }

  /**
   * Get overdue workflows
   */
  async getOverdueWorkflows(): Promise<WorkflowInstance[]> {
    const response = await this.axiosInstance.get('/workflows/overdue');
    return response.data.data;
  }

  /**
   * Get workflows requiring attention
   */
  async getAttentionRequiredWorkflows(): Promise<WorkflowInstance[]> {
    const response = await this.axiosInstance.get('/workflows/attention-required');
    return response.data.data;
  }

  // ==================== MUNICIPAL SPECIFIC ====================

  /**
   * Create council meeting
   */
  async createCouncilMeeting(data: {
    title: string;
    description?: string;
    scheduledDate: string;
    durationMinutes: number;
    location: string;
    meetingType: 'ordinary' | 'special' | 'committee' | 'extraordinary';
    metadata?: Record<string, any>;
  }): Promise<WorkflowInstance> {
    return this.createInstance({
      workflowId: 'council-meeting-management',
      title: data.title,
      description: data.description,
      priority: 'high',
      metadata: {
        ...data,
        workflowType: 'council-meeting',
      },
    });
  }

  /**
   * Create service request
   */
  async createServiceRequest(data: {
    serviceType: string;
    serviceCategory: string;
    description: string;
    location: string;
    citizenName?: string;
    contactEmail?: string;
    contactPhone?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
  }): Promise<WorkflowInstance> {
    return this.createInstance({
      workflowId: 'service-request-management',
      title: `${data.serviceType} - ${data.location}`,
      description: data.description,
      priority: data.priority || 'medium',
      metadata: {
        ...data,
        workflowType: 'service-request',
      },
    });
  }

  /**
   * Create document workflow
   */
  async createDocumentWorkflow(data: {
    title: string;
    description?: string;
    documentType: string;
    confidentialityLevel?: 'public' | 'internal' | 'confidential' | 'secret';
    retentionPeriodYears?: number;
    metadata?: Record<string, any>;
  }): Promise<WorkflowInstance> {
    return this.createInstance({
      workflowId: 'document-workflow',
      title: data.title,
      description: data.description,
      priority: 'medium',
      metadata: {
        ...data,
        workflowType: 'document',
      },
    });
  }

  /**
   * Create compliance workflow
   */
  async createComplianceWorkflow(data: {
    title: string;
    description?: string;
    recordType: 'data_inventory' | 'risk_assessment' | 'consent_record' | 'breach_report' | 'audit_trail';
    dataCategory?: string;
    popiaPrinciple?: string;
    metadata?: Record<string, any>;
  }): Promise<WorkflowInstance> {
    return this.createInstance({
      workflowId: 'compliance-workflow',
      title: data.title,
      description: data.description,
      priority: 'high',
      metadata: {
        ...data,
        workflowType: 'compliance',
      },
    });
  }

  /**
   * Create committee workflow
   */
  async createCommitteeWorkflow(data: {
    title: string;
    description?: string;
    committeeType: string;
    agendaItems?: string[];
    metadata?: Record<string, any>;
  }): Promise<WorkflowInstance> {
    return this.createInstance({
      workflowId: 'committee-workflow',
      title: data.title,
      description: data.description,
      priority: 'medium',
      metadata: {
        ...data,
        workflowType: 'committee',
      },
    });
  }
}

export const municipalWorkflowService = new MunicipalWorkflowService();