import { api } from './api';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
}

export const getProfile = async () => {
  return await api.get<UserProfile>('profile');
};

export const updateProfile = async (updates: ProfileUpdateData) => {
  return await api.put<UserProfile>('profile', updates);
};
