import { supabase } from '@/lib/supabase';

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  month: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  category?: 'goal' | 'investment';
  color: string;
  deadline?: string;
}

export const getBudgets = async (month: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('expense_limits')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', month);

  if (error) throw error;
  return data as Budget[];
};

export const upsertBudget = async (budget: Omit<Budget, 'id' | 'user_id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check if it exists first to avoid onConflict constraint issues with composite keys
  const { data: existing } = await supabase
    .from('expense_limits')
    .select('id')
    .eq('user_id', user.id)
    .eq('category', budget.category)
    .eq('month', budget.month)
    .maybeSingle();

  let response;
  if (existing && existing.id) {
    response = await supabase
      .from('expense_limits')
      .update({ ...budget, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    response = await supabase
      .from('expense_limits')
      .insert({ ...budget, user_id: user.id })
      .select()
      .single();
  }

  if (response.error) throw response.error;
  return response.data as Budget;
};

export const getSavingsGoals = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as SavingsGoal[];
};

export const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'user_id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('savings_goals')
    .insert([{ ...goal, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data as SavingsGoal;
};

export const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
  const { data, error } = await supabase
    .from('savings_goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SavingsGoal;
};

export const deleteSavingsGoal = async (id: string) => {
  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
