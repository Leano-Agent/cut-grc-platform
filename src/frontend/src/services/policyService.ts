import apiClient from './apiClient';

export interface Policy {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  version: string;
  content: string | null;
  scope: string | null;
  department: string | null;
  ownerId: string | null;
  approverId: string | null;
  effectiveDate: string | null;
  reviewDate: string | null;
  expiryDate: string | null;
  tags: string[];
  attachments: string[];
  regulatoryReferences: string[];
  lastUpdated: string;
  createdAt: string;
}

export interface PolicyStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  expiringSoon: number;
  needsReview: number;
}

export interface PolicyFormData {
  title: string;
  description?: string;
  category: string;
  content?: string;
  scope?: string;
  department?: string;
  ownerId?: string;
  approverId?: string;
  effectiveDate?: string;
  reviewDate?: string;
  expiryDate?: string;
  tags?: string[];
  regulatoryReferences?: string[];
}

const policyService = {
  /**
   * Get all policies with optional filters
   */
  getAll: async (filters?: { category?: string; status?: string; search?: string }): Promise<Policy[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    
    const query = params.toString();
    const response = await apiClient.get(`/api/v1/policies${query ? `?${query}` : ''}`);
    return response.data;
  },

  /**
   * Get a single policy by ID
   */
  getById: async (id: string): Promise<Policy> => {
    const response = await apiClient.get(`/api/v1/policies/${id}`);
    return response.data;
  },

  /**
   * Create a new policy
   */
  create: async (data: PolicyFormData): Promise<Policy> => {
    const response = await apiClient.post('/api/v1/policies', data);
    return response.data;
  },

  /**
   * Update an existing policy
   */
  update: async (id: string, data: Partial<PolicyFormData>): Promise<Policy> => {
    const response = await apiClient.put(`/api/v1/policies/${id}`, data);
    return response.data;
  },

  /**
   * Update policy status (workflow transition)
   */
  updateStatus: async (id: string, status: string): Promise<Policy> => {
    const response = await apiClient.patch(`/api/v1/policies/${id}/status`, { status });
    return response.data;
  },

  /**
   * Delete (archive) a policy
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/policies/${id}`);
  },

  /**
   * Get policy statistics
   */
  getStats: async (): Promise<PolicyStats> => {
    const response = await apiClient.get('/api/v1/policies/stats/summary');
    return response.data;
  },

  /**
   * Policy category options
   */
  categories: [
    { value: 'information_security', label: 'Information Security' },
    { value: 'data_privacy', label: 'Data Privacy' },
    { value: 'acceptable_use', label: 'Acceptable Use' },
    { value: 'access_control', label: 'Access Control' },
    { value: 'business_continuity', label: 'Business Continuity' },
    { value: 'incident_response', label: 'Incident Response' },
    { value: 'hr', label: 'HR & Personnel' },
    { value: 'financial', label: 'Financial' },
    { value: 'compliance', label: 'Compliance & Regulatory' },
    { value: 'it_governance', label: 'IT Governance' },
    { value: 'other', label: 'Other' },
  ] as { value: string; label: string }[],

  /**
   * Policy status options
   */
  statuses: [
    { value: 'draft', label: 'Draft', color: '#9e9e9e' },
    { value: 'under_review', label: 'Under Review', color: '#ff9800' },
    { value: 'approved', label: 'Approved', color: '#2196f3' },
    { value: 'published', label: 'Published', color: '#4caf50' },
    { value: 'expired', label: 'Expired', color: '#f44336' },
    { value: 'archived', label: 'Archived', color: '#607d8b' },
  ] as { value: string; label: string; color: string }[],

  /**
   * Valid workflow transitions
   */
  getValidTransitions: (currentStatus: string): { value: string; label: string }[] => {
    const transitions: Record<string, string[]> = {
      draft: ['under_review', 'archived'],
      under_review: ['approved', 'draft', 'archived'],
      approved: ['published', 'draft', 'archived'],
      published: ['expired', 'archived'],
      expired: ['draft', 'archived'],
      archived: ['draft'],
    };

    const allowed = transitions[currentStatus] || [];
    const statusLabels: Record<string, string> = {
      draft: 'Send to Draft',
      under_review: 'Send for Review',
      approved: 'Approve Policy',
      published: 'Publish Policy',
      expired: 'Mark as Expired',
      archived: 'Move to Archive',
    };

    return allowed.map(v => ({ value: v, label: statusLabels[v] || v }));
  },
};

export default policyService;
