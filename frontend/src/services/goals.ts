import { api } from './api';

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
  return await api.get<Budget[]>(`budgets?month=${month}`);
};

export const upsertBudget = async (budget: Omit<Budget, 'id' | 'user_id'>) => {
  // Since FastAPI backend doesn't have a direct upsert for budgets, 
  // we first check if the budget for this category and month exists.
  const existingBudgets = await getBudgets(budget.month);
  const existing = existingBudgets.find(b => b.category === budget.category);
  
  if (existing) {
    return await api.put<Budget>(`budgets/${existing.id}`, budget);
  } else {
    return await api.post<Budget>('budgets', budget);
  }
};

export const getSavingsGoals = async () => {
  return await api.get<SavingsGoal[]>('goals');
};

export const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'user_id'>) => {
  return await api.post<SavingsGoal>('goals', goal);
};

export const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
  return await api.put<SavingsGoal>(`goals/${id}`, updates);
};

export const deleteSavingsGoal = async (id: string) => {
  return await api.delete(`goals/${id}`);
};
