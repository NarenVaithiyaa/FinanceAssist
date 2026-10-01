import { api } from './api';

export interface AccountBalances {
  id: string;
  user_id: string;
  bank: number;
  wallet: number;
  updated_at: string;
}

export const getAccountBalances = async () => {
  return await api.get<AccountBalances | null>('accounts/balances');
};

export const updateBalances = async (updates: Partial<Pick<AccountBalances, 'bank' | 'wallet'>>) => {
  return await api.put<AccountBalances>('accounts/balances', updates);
};
