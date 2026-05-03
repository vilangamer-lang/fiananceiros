export type TransactionType = 'income' | 'expense';
export type UserType = 'Samuel' | 'Emlyn' | 'Casal';

export type Category = 
  | 'home' 
  | 'food' 
  | 'credit_card' 
  | 'financing' 
  | 'salary' 
  | 'leisure' 
  | 'other';

export interface Transaction {
  id: string;
  userId: 'Samuel' | 'Emlyn';
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
  installments?: {
    current: number;
    total: number;
  };
}

export interface FinancialState {
  income: number;
  transactions: Transaction[];
}
