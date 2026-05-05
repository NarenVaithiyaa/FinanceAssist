import { supabase } from '@/lib/supabase';

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
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return data as Transaction[];
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...transaction, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
};

export const deleteTransaction = async (id: string) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
