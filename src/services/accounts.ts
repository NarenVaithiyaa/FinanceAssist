import { supabase } from '@/lib/supabase';

export interface AccountBalances {
  id: string;
  user_id: string;
  bank: number;
  wallet: number;
  updated_at: string;
}

export const getAccountBalances = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('account_balances')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as AccountBalances | null;
};

export const updateBalances = async (updates: Partial<Pick<AccountBalances, 'bank' | 'wallet'>>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: existing } = await supabase
    .from('account_balances')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  let response;
  if (existing && existing.id) {
    response = await supabase
      .from('account_balances')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    response = await supabase
      .from('account_balances')
      .insert({ user_id: user.id, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();
  }

  if (response.error) throw response.error;
  return response.data as AccountBalances;
};
