import apiClient from './apiClient';

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
  assignedTo: string | null;
}

export interface ActionComment {
  id: string;
  comment: string;
  userId: string | null;
  createdAt: string;
}

export interface Action {
  id: string;
  title: string;
  description: string | null;
  source: string;
  sourceId: string | null;
  sourceRef: string | null;
  status: string;
  priority: string;
  category: string;
  department: string | null;
  assignedTo: string | null;
  dueDate: string | null;
  completedAt: string | null;
  rootCause: string | null;
  resolution: string | null;
  closureNotes: string | null;
  evidence: string[];
  relatedActionIds: string[];
  tags: string[];
  checklist: ChecklistItem[];
  comments: ActionComment[];
  lastUpdated: string;
  createdAt: string;
}

export interface ActionStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  bySource: Record<string, number>;
  overdue: number;
  completed: number;
  openCount: number;
}

const actionService = {
  getAll: async (filters?: { status?: string; priority?: string; source?: string; search?: string; overdue?: boolean }): Promise<Action[]> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) => { if (v !== undefined && v !== '') params.append(k, String(v)); });
    const q = params.toString();
    const res = await apiClient.get(`/api/v1/actions${q ? `?${q}` : ''}`);
    return res.data;
  },
  getById: async (id: string): Promise<Action> => { const r = await apiClient.get(`/api/v1/actions/${id}`); return r.data; },
  getStats: async (): Promise<ActionStats> => { const r = await apiClient.get('/api/v1/actions/stats/summary'); return r.data; },
  create: async (data: any): Promise<Action> => { const r = await apiClient.post('/api/v1/actions', data); return r.data; },
  update: async (id: string, data: any): Promise<Action> => { const r = await apiClient.put(`/api/v1/actions/${id}`, data); return r.data; },
  updateStatus: async (id: string, status: string): Promise<Action> => { const r = await apiClient.patch(`/api/v1/actions/${id}/status`, { status }); return r.data; },
  getComments: async (id: string): Promise<ActionComment[]> => { const r = await apiClient.get(`/api/v1/actions/${id}/comments`); return r.data; },
  addComment: async (id: string, data: any): Promise<ActionComment> => { const r = await apiClient.post(`/api/v1/actions/${id}/comments`, data); return r.data; },
  getChecklist: async (id: string): Promise<ChecklistItem[]> => { const r = await apiClient.get(`/api/v1/actions/${id}/checklist`); return r.data; },
  addChecklistItem: async (id: string, data: any): Promise<ChecklistItem> => { const r = await apiClient.post(`/api/v1/actions/${id}/checklist`, data); return r.data; },
  updateChecklistItem: async (id: string, itemId: string, data: any): Promise<ChecklistItem> => { const r = await apiClient.put(`/api/v1/actions/${id}/checklist/${itemId}`, data); return r.data; },
  deleteChecklistItem: async (id: string, itemId: string): Promise<void> => { await apiClient.delete(`/api/v1/actions/${id}/checklist/${itemId}`); },

  sources: [
    { value: 'audit', label: 'Audit Finding' }, { value: 'incident', label: 'Incident' },
    { value: 'risk', label: 'Risk Assessment' }, { value: 'compliance', label: 'Compliance' },
    { value: 'policy', label: 'Policy Review' }, { value: 'survey', label: 'Survey' },
    { value: 'board', label: 'Board/Committee' }, { value: 'control', label: 'Control Test' },
    { value: 'vendor', label: 'Vendor Assessment' }, { value: 'other', label: 'Other' },
  ],
  priorities: [
    { value: 'critical', label: 'Critical', color: '#d32f2f' },
    { value: 'high', label: 'High', color: '#f44336' },
    { value: 'medium', label: 'Medium', color: '#ff9800' },
    { value: 'low', label: 'Low', color: '#4caf50' },
  ],
  categories: [
    { value: 'corrective', label: 'Corrective' }, { value: 'preventive', label: 'Preventive' },
    { value: 'improvement', label: 'Improvement' },
  ],
  statuses: [
    { value: 'open', label: 'Open', color: '#9e9e9e' },
    { value: 'in_progress', label: 'In Progress', color: '#2196f3' },
    { value: 'under_review', label: 'Under Review', color: '#ff9800' },
    { value: 'closed', label: 'Closed', color: '#4caf50' },
    { value: 'rejected', label: 'Rejected', color: '#f44336' },
  ],
  getValidTransitions: (status: string): { value: string; label: string }[] => {
    const t: Record<string, string[]> = { open: ['in_progress', 'closed', 'rejected'], in_progress: ['under_review', 'open', 'closed'], under_review: ['closed', 'in_progress', 'rejected'], closed: ['open'], rejected: ['open'] };
    const l: Record<string, string> = { open: 'Reopen', in_progress: 'Start Work', under_review: 'Submit for Review', closed: 'Close Action', rejected: 'Reject' };
    return (t[status] || []).map(v => ({ value: v, label: l[v] || v }));
  },
};

export default actionService;
