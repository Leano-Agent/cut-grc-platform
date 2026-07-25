import apiClient from './apiClient';

export interface Question {
  id: string;
  type: 'text' | 'paragraph' | 'multiple_choice' | 'single_choice' | 'rating' | 'date' | 'file' | 'email' | 'number';
  title: string;
  description: string | null;
  required: boolean;
  options: string[] | null;
  defaultValue: string | null;
  order: number;
  validation: { min?: number; max?: number; minLength?: number; maxLength?: number; pattern?: string } | null;
}

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  questions: Question[];
  department: string | null;
  targetAudience: string | null;
  anonymous: boolean;
  requireLogin: boolean;
  allowMultipleSubmissions: boolean;
  maxSubmissions: number | null;
  closeDate: string | null;
  totalResponses: number;
  tags: string[];
  lastUpdated: string;
  createdAt: string;
}

export interface SurveyStats {
  total: number;
  byStatus: Record<string, number>;
  activePublished: number;
  totalResponses: number;
}

export interface SurveyResults {
  totalResponses: number;
  questions: {
    questionId: string;
    title: string;
    type: string;
    optionCounts?: Record<string, number>;
    average?: number;
    distribution?: number[];
    responses?: any[];
  }[];
}

export interface SurveyFormData {
  title: string;
  description?: string;
  category: string;
  department?: string;
  targetAudience?: string;
  anonymous?: boolean;
  requireLogin?: boolean;
  closeDate?: string;
  tags?: string[];
}

const surveyService = {
  getAll: async (filters?: { category?: string; status?: string; search?: string }): Promise<Survey[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    const q = params.toString();
    const res = await apiClient.get(`/api/v1/surveys${q ? `?${q}` : ''}`);
    return res.data;
  },

  getById: async (id: string): Promise<Survey> => {
    const res = await apiClient.get(`/api/v1/surveys/${id}`);
    return res.data;
  },

  create: async (data: SurveyFormData): Promise<Survey> => {
    const res = await apiClient.post('/api/v1/surveys', data);
    return res.data;
  },

  update: async (id: string, data: Partial<SurveyFormData>): Promise<Survey> => {
    const res = await apiClient.put(`/api/v1/surveys/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<Survey> => {
    const res = await apiClient.patch(`/api/v1/surveys/${id}/status`, { status });
    return res.data;
  },

  addQuestion: async (surveyId: string, question: Partial<Question>): Promise<Question> => {
    const res = await apiClient.post(`/api/v1/surveys/${surveyId}/questions`, question);
    return res.data;
  },

  updateQuestion: async (surveyId: string, questionId: string, data: Partial<Question>): Promise<Question> => {
    const res = await apiClient.put(`/api/v1/surveys/${surveyId}/questions/${questionId}`, data);
    return res.data;
  },

  deleteQuestion: async (surveyId: string, questionId: string): Promise<Question[]> => {
    const res = await apiClient.delete(`/api/v1/surveys/${surveyId}/questions/${questionId}`);
    return res.data;
  },

  reorderQuestions: async (surveyId: string, questionIds: string[]): Promise<Question[]> => {
    const res = await apiClient.put(`/api/v1/surveys/${surveyId}/questions/reorder`, { questionIds });
    return res.data;
  },

  submitResponse: async (surveyId: string, data: { answers: { questionId: string; value: any }[]; respondent?: string; respondentEmail?: string }): Promise<any> => {
    const res = await apiClient.post(`/api/v1/surveys/${surveyId}/responses`, data);
    return res.data;
  },

  getResponses: async (surveyId: string): Promise<any[]> => {
    const res = await apiClient.get(`/api/v1/surveys/${surveyId}/responses`);
    return res.data;
  },

  getResults: async (surveyId: string): Promise<SurveyResults> => {
    const res = await apiClient.get(`/api/v1/surveys/${surveyId}/results`);
    return res.data;
  },

  getStats: async (): Promise<SurveyStats> => {
    const res = await apiClient.get('/api/v1/surveys/stats/summary');
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/surveys/${id}`);
  },

  categories: [
    { value: 'compliance', label: 'Compliance' },
    { value: 'risk_assessment', label: 'Risk Assessment' },
    { value: 'audit', label: 'Audit' },
    { value: 'training', label: 'Training & Development' },
    { value: 'employee', label: 'Employee Feedback' },
    { value: 'customer', label: 'Customer Satisfaction' },
    { value: 'vendor', label: 'Vendor Assessment' },
    { value: 'security', label: 'Security Awareness' },
    { value: 'other', label: 'Other' },
  ],

  statuses: [
    { value: 'draft', label: 'Draft', color: '#9e9e9e' },
    { value: 'published', label: 'Published', color: '#4caf50' },
    { value: 'closed', label: 'Closed', color: '#f44336' },
    { value: 'archived', label: 'Archived', color: '#607d8b' },
  ],

  questionTypes: [
    { value: 'text', label: 'Short Text' },
    { value: 'paragraph', label: 'Paragraph' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'single_choice', label: 'Single Choice' },
    { value: 'rating', label: 'Rating (1-5)' },
    { value: 'date', label: 'Date' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
  ],
};

export default surveyService;
