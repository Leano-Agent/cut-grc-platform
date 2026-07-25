import apiClient from './apiClient';

export interface BoardMember {
  userId: string;
  role: string;
  position: string | null;
  appointedAt: string;
  termEnd: string | null;
  isActive: boolean;
}

export interface AgendaItem {
  item: string;
  description: string | null;
  presenter: string | null;
  duration: number | null;
}

export interface BoardDecision {
  title: string;
  description: string | null;
  status: string;
  owner: string | null;
  dueDate: string | null;
}

export interface AttendanceRecord {
  userId: string;
  status: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  status: string;
  location: string | null;
  agenda: AgendaItem[];
  minutes: string | null;
  decisions: BoardDecision[];
  attendance: AttendanceRecord[];
}

export interface Board {
  id: string;
  name: string;
  description: string | null;
  type: string;
  category: string;
  status: string;
  charter: string | null;
  mission: string | null;
  meetingFrequency: string | null;
  quorum: number | null;
  termLength: number | null;
  parentBoardId: string | null;
  members: BoardMember[];
  meetings: Meeting[];
  tags: string[];
  lastUpdated: string;
  createdAt: string;
}

export interface BoardStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  totalMembers: number;
  totalMeetings: number;
  upcomingMeetings: number;
}

const boardService = {
  getAll: async (filters?: { type?: string; status?: string; category?: string; search?: string }): Promise<Board[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    const q = params.toString();
    const res = await apiClient.get(`/api/v1/boards${q ? `?${q}` : ''}`);
    return res.data;
  },
  getById: async (id: string): Promise<Board> => { const r = await apiClient.get(`/api/v1/boards/${id}`); return r.data; },
  getStats: async (): Promise<BoardStats> => { const r = await apiClient.get('/api/v1/boards/stats/summary'); return r.data; },
  create: async (data: any): Promise<Board> => { const r = await apiClient.post('/api/v1/boards', data); return r.data; },
  update: async (id: string, data: any): Promise<Board> => { const r = await apiClient.put(`/api/v1/boards/${id}`, data); return r.data; },
  delete: async (id: string): Promise<void> => { await apiClient.delete(`/api/v1/boards/${id}`); },
  addMember: async (boardId: string, data: any): Promise<BoardMember> => { const r = await apiClient.post(`/api/v1/boards/${boardId}/members`, data); return r.data; },
  updateMember: async (boardId: string, userId: string, data: any): Promise<BoardMember> => { const r = await apiClient.put(`/api/v1/boards/${boardId}/members/${userId}`, data); return r.data; },
  removeMember: async (boardId: string, userId: string): Promise<void> => { await apiClient.delete(`/api/v1/boards/${boardId}/members/${userId}`); },
  addMeeting: async (boardId: string, data: any): Promise<Meeting> => { const r = await apiClient.post(`/api/v1/boards/${boardId}/meetings`, data); return r.data; },
  updateMeeting: async (boardId: string, meetingId: string, data: any): Promise<Meeting> => { const r = await apiClient.put(`/api/v1/boards/${boardId}/meetings/${meetingId}`, data); return r.data; },
  markAttendance: async (boardId: string, meetingId: string, data: any): Promise<any> => { const r = await apiClient.post(`/api/v1/boards/${boardId}/meetings/${meetingId}/attendance`, data); return r.data; },
  addDecision: async (boardId: string, meetingId: string, data: any): Promise<any> => { const r = await apiClient.post(`/api/v1/boards/${boardId}/meetings/${meetingId}/decisions`, data); return r.data; },

  types: [
    { value: 'board', label: 'Board' }, { value: 'committee', label: 'Committee' },
    { value: 'subcommittee', label: 'Subcommittee' }, { value: 'task_force', label: 'Task Force' },
    { value: 'working_group', label: 'Working Group' },
  ],
  categories: [
    { value: 'audit', label: 'Audit' }, { value: 'risk', label: 'Risk' },
    { value: 'compliance', label: 'Compliance' }, { value: 'governance', label: 'Governance' },
    { value: 'finance', label: 'Finance' }, { value: 'hr', label: 'HR' },
    { value: 'it', label: 'IT' }, { value: 'strategy', label: 'Strategy' }, { value: 'other', label: 'Other' },
  ],
  memberRoles: [
    { value: 'chairperson', label: 'Chairperson' }, { value: 'vice_chairperson', label: 'Vice Chairperson' },
    { value: 'secretary', label: 'Secretary' }, { value: 'member', label: 'Member' },
    { value: 'observer', label: 'Observer' }, { value: 'advisor', label: 'Advisor' },
  ],
  meetingStatuses: [
    { value: 'scheduled', label: 'Scheduled', color: '#2196f3' },
    { value: 'in_progress', label: 'In Progress', color: '#ff9800' },
    { value: 'completed', label: 'Completed', color: '#4caf50' },
    { value: 'cancelled', label: 'Cancelled', color: '#f44336' },
  ],
};

export default boardService;
