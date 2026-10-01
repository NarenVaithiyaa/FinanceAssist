import { api } from './api';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'income' | 'expense';
  source: 'bank' | 'wallet' | null;
  destination: 'bank' | 'wallet' | null;
  created_at: string;
  updated_at: string;
}

export const getTransactions = async () => {
  return await api.get<Transaction[]>('transactions');
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  return await api.post<Transaction>('transactions', transaction);
};

export const deleteTransaction = async (id: string) => {
  return await api.delete(`transactions/${id}`);
};
