import apiClient from './apiClient';

export interface TrainingModule {
  title: string;
  type: string;
  duration: number;
  order: number;
}

export interface EnrolledUser {
  userId: string;
  enrolledAt: string | null;
  completedAt: string | null;
  score: number | null;
  status: string;
}

export interface Training {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  status: string;
  department: string | null;
  assignedTo: string[];
  completionRate: number;
  dueDate: string | null;
  expiryDate: string | null;
  modules: TrainingModule[];
  enrolledUsers: EnrolledUser[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingStats {
  total: number;
  active: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  completionRate: number;
  totalEnrolled: number;
  totalCompleted: number;
  overdue: number;
}

export interface TrainingFormData {
  title: string;
  description?: string;
  type: string;
  category: string;
  department?: string;
  assignedTo?: string[];
  dueDate?: string;
  expiryDate?: string;
  modules?: TrainingModule[];
  tags?: string[];
}

const trainingService = {
  /**
   * Get all training programmes with optional filters
   */
  getAll: async (filters?: { category?: string; status?: string; type?: string; department?: string; search?: string }): Promise<Training[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString();
    const response = await apiClient.get(`/api/v1/training${query ? `?${query}` : ''}`);
    return response.data;
  },

  /**
   * Get a single training programme by ID
   */
  getById: async (id: string): Promise<Training> => {
    const response = await apiClient.get(`/api/v1/training/${id}`);
    return response.data;
  },

  /**
   * Create a new training programme
   */
  create: async (data: TrainingFormData): Promise<Training> => {
    const response = await apiClient.post('/api/v1/training', data);
    return response.data;
  },

  /**
   * Update an existing training programme
   */
  update: async (id: string, data: Partial<TrainingFormData>): Promise<Training> => {
    const response = await apiClient.put(`/api/v1/training/${id}`, data);
    return response.data;
  },

  /**
   * Update training status (workflow transition)
   */
  updateStatus: async (id: string, status: string): Promise<Training> => {
    const response = await apiClient.patch(`/api/v1/training/${id}/status`, { status });
    return response.data;
  },

  /**
   * Enroll a user in a training programme
   */
  enrollUser: async (id: string, userId: string): Promise<Training> => {
    const response = await apiClient.post(`/api/v1/training/${id}/enroll`, { userId });
    return response.data;
  },

  /**
   * Mark user completion with score
   */
  completeUser: async (id: string, userId: string, data: { score?: number; status?: string }): Promise<Training> => {
    const response = await apiClient.patch(`/api/v1/training/${id}/users/${userId}`, data);
    return response.data;
  },

  /**
   * Delete (archive) a training programme
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/training/${id}`);
  },

  /**
   * Get training statistics
   */
  getStats: async (): Promise<TrainingStats> => {
    const response = await apiClient.get('/api/v1/training/stats/summary');
    return response.data;
  },

  /**
   * Training type options
   */
  types: [
    { value: 'mandatory', label: 'Mandatory' },
    { value: 'elective', label: 'Elective' },
    { value: 'certification', label: 'Certification' },
    { value: 'awareness', label: 'Awareness' },
  ] as { value: string; label: string }[],

  /**
   * Training category options
   */
  categories: [
    { value: 'compliance', label: 'Compliance' },
    { value: 'security', label: 'Security' },
    { value: 'popia', label: 'POPIA' },
    { value: 'risk', label: 'Risk Management' },
    { value: 'governance', label: 'Governance' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'other', label: 'Other' },
  ] as { value: string; label: string }[],

  /**
   * Training status options
   */
  statuses: [
    { value: 'draft', label: 'Draft', color: '#9e9e9e' },
    { value: 'active', label: 'Active', color: '#4caf50' },
    { value: 'expired', label: 'Expired', color: '#f44336' },
    { value: 'archived', label: 'Archived', color: '#607d8b' },
  ] as { value: string; label: string; color: string }[],

  /**
   * Valid workflow transitions
   */
  getValidTransitions: (currentStatus: string): { value: string; label: string }[] => {
    const transitions: Record<string, string[]> = {
      draft: ['active', 'archived'],
      active: ['expired', 'archived'],
      expired: ['active', 'archived'],
      archived: ['draft'],
    };

    const allowed = transitions[currentStatus] || [];
    const statusLabels: Record<string, string> = {
      draft: 'Send to Draft',
      active: 'Activate Training',
      expired: 'Mark as Expired',
      archived: 'Move to Archive',
    };

    return allowed.map(v => ({ value: v, label: statusLabels[v] || v }));
  },
};

export default trainingService;
