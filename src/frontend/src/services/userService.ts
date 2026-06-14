import api from './apiClient'
import { User } from '../store/slices/authSlice'

export interface SystemUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'manager' | 'user' | 'auditor' | 'compliance_officer'
  department: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

class UserService {
  async getUsers(params?: { role?: string; department?: string; isActive?: boolean }): Promise<SystemUser[]> {
    const response = await api.get<{ data: SystemUser[] }>('/users', { params })
    return response.data.data || response.data as any
  }

  async getUserById(id: string): Promise<SystemUser> {
    const response = await api.get<{ data: SystemUser }>(`/users/${id}`)
    return response.data.data || response.data as any
  }

  async createUser(user: Omit<SystemUser, 'id' | 'createdAt' | 'lastLogin'> & { password: string }): Promise<SystemUser> {
    const response = await api.post<{ data: SystemUser }>('/users', user)
    return response.data.data || response.data as any
  }

  async updateUser(id: string, user: Partial<SystemUser> & { password?: string }): Promise<SystemUser> {
    const response = await api.put<{ data: SystemUser }>(`/users/${id}`, user)
    return response.data.data || response.data as any
  }

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  }

  async suspendUser(id: string): Promise<SystemUser> {
    return this.updateUser(id, { isActive: false } as any)
  }

  async activateUser(id: string): Promise<SystemUser> {
    return this.updateUser(id, { isActive: true } as any)
  }
}

export const userService = new UserService()
