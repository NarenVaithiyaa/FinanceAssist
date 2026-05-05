import { supabase } from '@/lib/supabase';

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('emis')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as EMI[];
};

export const addEMI = async (emi: Omit<EMI, 'id' | 'user_id' | 'created_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('emis')
    .insert([{ ...emi, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data as EMI;
};

export const deleteEMI = async (id: string) => {
  const { error } = await supabase
    .from('emis')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
