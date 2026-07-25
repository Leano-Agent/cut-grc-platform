import apiClient from './apiClient';

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  category: string;
  severity: string;
  priority: string;
  status: string;
  reportedBy: string | null;
  assignedTo: string | null;
  department: string | null;
  location: string | null;
  detectionMethod: string | null;
  impact: string | null;
  rootCause: string | null;
  remediation: string | null;
  lessonsLearned: string | null;
  slaDeadline: string | null;
  slaBreached: boolean;
  resolvedAt: string | null;
  closedAt: string | null;
  tags: string[];
  evidence: string[];
  regulatoryObligations: string[];
  lastUpdated: string;
  createdAt: string;
}

export interface IncidentStats {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  openIncidents: number;
  slaBreached: number;
  criticalOpen: number;
}

export interface IncidentFormData {
  title: string;
  description?: string;
  category: string;
  severity: string;
  priority: string;
  department?: string;
  location?: string;
  detectionMethod?: string;
  impact?: string;
  tags?: string[];
  regulatoryObligations?: string[];
}

const incidentService = {
  getAll: async (filters?: { category?: string; status?: string; severity?: string; search?: string }): Promise<Incident[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString();
    const response = await apiClient.get(`/api/v1/incidents${query ? `?${query}` : ''}`);
    return response.data;
  },

  getById: async (id: string): Promise<Incident> => {
    const response = await apiClient.get(`/api/v1/incidents/${id}`);
    return response.data;
  },

  create: async (data: IncidentFormData): Promise<Incident> => {
    const response = await apiClient.post('/api/v1/incidents', data);
    return response.data;
  },

  update: async (id: string, data: Partial<IncidentFormData & { rootCause?: string; remediation?: string; lessonsLearned?: string }>): Promise<Incident> => {
    const response = await apiClient.put(`/api/v1/incidents/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<Incident> => {
    const response = await apiClient.patch(`/api/v1/incidents/${id}/status`, { status });
    return response.data;
  },

  assign: async (id: string, assignedTo: string): Promise<Incident> => {
    const response = await apiClient.patch(`/api/v1/incidents/${id}/assign`, { assignedTo });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/incidents/${id}`);
  },

  getStats: async (): Promise<IncidentStats> => {
    const response = await apiClient.get('/api/v1/incidents/stats/summary');
    return response.data;
  },

  categories: [
    { value: 'security', label: 'Security Incident' },
    { value: 'data_breach', label: 'Data Breach' },
    { value: 'fraud', label: 'Fraud' },
    { value: 'compliance_violation', label: 'Compliance Violation' },
    { value: 'operational', label: 'Operational Failure' },
    { value: 'hr', label: 'HR / Personnel' },
    { value: 'physical', label: 'Physical Security' },
    { value: 'privacy', label: 'Privacy' },
    { value: 'other', label: 'Other' },
  ] as { value: string; label: string }[],

  severities: [
    { value: 'critical', label: 'Critical', color: '#d32f2f' },
    { value: 'high', label: 'High', color: '#f44336' },
    { value: 'medium', label: 'Medium', color: '#ff9800' },
    { value: 'low', label: 'Low', color: '#4caf50' },
  ] as { value: string; label: string; color: string }[],

  statuses: [
    { value: 'reported', label: 'Reported', color: '#9e9e9e' },
    { value: 'investigating', label: 'Investigating', color: '#2196f3' },
    { value: 'contained', label: 'Contained', color: '#ff9800' },
    { value: 'resolved', label: 'Resolved', color: '#4caf50' },
    { value: 'closed', label: 'Closed', color: '#607d8b' },
  ] as { value: string; label: string; color: string }[],

  getValidTransitions: (currentStatus: string): { value: string; label: string }[] => {
    const transitions: Record<string, string[]> = {
      reported: ['investigating', 'resolved', 'closed'],
      investigating: ['contained', 'resolved', 'reported'],
      contained: ['resolved', 'investigating'],
      resolved: ['closed', 'investigating'],
      closed: ['investigating'],
    };
    const labels: Record<string, string> = {
      reported: 'Reopen as Reported',
      investigating: 'Start Investigation',
      contained: 'Mark as Contained',
      resolved: 'Mark as Resolved',
      closed: 'Close Incident',
    };
    return (transitions[currentStatus] || []).map(v => ({ value: v, label: labels[v] || v }));
  },
};

export default incidentService;
