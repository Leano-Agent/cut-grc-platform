import apiClient from './apiClient';

export interface Vendor {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  vendorType: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  serviceDescription: string | null;
  contractValue: number | null;
  contractStart: string | null;
  contractEnd: string | null;
  cyberScore: number | null;
  complianceScore: number | null;
  riskScore: number | null;
  assessmentStatus: string;
  lastAssessmentDate: string | null;
  nextAssessmentDate: string | null;
  certifications: string[];
  documents: { name: string; type: string; uploadedAt: string }[];
  notes: string | null;
  tags: string[];
  metadata: Record<string, any>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorStats {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byRiskLevel: Record<string, number>;
  assessed: number;
  expired: number;
  inProgress: number;
  notAssessed: number;
  totalContractValue: number;
  avgCyberScore: string | null;
}

export interface VendorFormData {
  name: string;
  description?: string;
  category: string;
  vendorType: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  serviceDescription?: string;
  contractValue?: number;
  contractStart?: string;
  contractEnd?: string;
  certifications?: string[];
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface AssessmentFormData {
  cyberScore: number;
  complianceScore: number;
  assessmentDate: string;
  nextAssessmentDate?: string;
}

const vendorService = {
  /**
   * Get all vendors with optional filters
   */
  getAll: async (filters?: {
    category?: string;
    status?: string;
    vendorType?: string;
    assessmentStatus?: string;
    riskScore?: string;
    search?: string;
  }): Promise<Vendor[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.vendorType) params.append('vendorType', filters.vendorType);
    if (filters?.assessmentStatus) params.append('assessmentStatus', filters.assessmentStatus);
    if (filters?.riskScore) params.append('riskScore', filters.riskScore);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString();
    const response = await apiClient.get(`/api/v1/vendors${query ? `?${query}` : ''}`);
    return response.data;
  },

  /**
   * Get a single vendor by ID
   */
  getById: async (id: string): Promise<Vendor> => {
    const response = await apiClient.get(`/api/v1/vendors/${id}`);
    return response.data;
  },

  /**
   * Create a new vendor
   */
  create: async (data: VendorFormData): Promise<Vendor> => {
    const response = await apiClient.post('/api/v1/vendors', data);
    return response.data;
  },

  /**
   * Update an existing vendor
   */
  update: async (id: string, data: Partial<VendorFormData>): Promise<Vendor> => {
    const response = await apiClient.put(`/api/v1/vendors/${id}`, data);
    return response.data;
  },

  /**
   * Perform vendor assessment (update scores)
   */
  assess: async (id: string, data: AssessmentFormData): Promise<Vendor> => {
    const response = await apiClient.patch(`/api/v1/vendors/${id}/assess`, data);
    return response.data;
  },

  /**
   * Delete (blacklist) a vendor
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/vendors/${id}`);
  },

  /**
   * Get vendor statistics
   */
  getStats: async (): Promise<VendorStats> => {
    const response = await apiClient.get('/api/v1/vendors/stats/summary');
    return response.data;
  },

  /**
   * Category options
   */
  categories: [
    { value: 'critical', label: 'Critical', color: '#f44336' },
    { value: 'high', label: 'High', color: '#ff9800' },
    { value: 'medium', label: 'Medium', color: '#2196f3' },
    { value: 'low', label: 'Low', color: '#4caf50' },
  ] as { value: string; label: string; color: string }[],

  /**
   * Vendor type options
   */
  vendorTypes: [
    { value: 'software', label: 'Software' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'cloud_service', label: 'Cloud Service' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'other', label: 'Other' },
  ] as { value: string; label: string }[],

  /**
   * Status options
   */
  statuses: [
    { value: 'active', label: 'Active', color: '#4caf50' },
    { value: 'inactive', label: 'Inactive', color: '#9e9e9e' },
    { value: 'under_review', label: 'Under Review', color: '#ff9800' },
    { value: 'blacklisted', label: 'Blacklisted', color: '#f44336' },
  ] as { value: string; label: string; color: string }[],

  /**
   * Assessment status options
   */
  assessmentStatuses: [
    { value: 'not_assessed', label: 'Not Assessed', color: '#9e9e9e' },
    { value: 'in_progress', label: 'In Progress', color: '#ff9800' },
    { value: 'assessed', label: 'Assessed', color: '#4caf50' },
    { value: 'expired', label: 'Expired', color: '#f44336' },
  ] as { value: string; label: string; color: string }[],

  /**
   * Get category color
   */
  getCategoryLabel: (category: string): string => {
    const cat = vendorService.categories.find(c => c.value === category);
    return cat?.label || category;
  },

  /**
   * Get status label
   */
  getStatusLabel: (status: string): string => {
    const s = vendorService.statuses.find(s => s.value === status);
    return s?.label || status;
  },

  /**
   * Get risk level label and color
   */
  getRiskInfo: (riskScore: number | null): { label: string; color: string } => {
    if (riskScore === null) return { label: 'N/A', color: '#9e9e9e' };
    if (riskScore <= 1) return { label: 'Very Low', color: '#4caf50' };
    if (riskScore <= 2) return { label: 'Low', color: '#8bc34a' };
    if (riskScore <= 3) return { label: 'Medium', color: '#ff9800' };
    if (riskScore <= 4) return { label: 'High', color: '#f44336' };
    return { label: 'Critical', color: '#b71c1c' };
  },
};

export default vendorService;
