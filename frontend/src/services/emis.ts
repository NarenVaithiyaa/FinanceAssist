import { api } from './api';

export interface EMI {
  id?: string;
  user_id?: string;
  name: string;
  principal: number;
  months: number;
  emi_amount: number;
  interest_rate?: number;
  start_date: string;
  created_at?: string;
}

export const getEMIs = async () => {
  return await api.get<EMI[]>('emis');
};

export const addEMI = async (emi: Omit<EMI, 'id' | 'user_id' | 'created_at'>) => {
  return await api.post<EMI>('emis', emi);
};

export const updateEMI = async (id: string, updates: Partial<EMI>) => {
  return await api.put<EMI>(`emis/${id}`, updates);
};

export const deleteEMI = async (id: string) => {
  return await api.delete(`emis/${id}`);
};
