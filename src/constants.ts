import { Transaction } from './types';

export const INITIAL_DATA: Transaction[] = [
  {
    id: '1',
    userId: 'Samuel',
    description: 'Via Credi 516',
    amount: 516,
    type: 'expense',
    category: 'financing',
    date: '2024-05-01',
    installments: { current: 7, total: 31 }
  },
  {
    id: '2',
    userId: 'Samuel',
    description: 'Via Credi 723',
    amount: 723,
    type: 'expense',
    category: 'financing',
    date: '2024-05-01',
    installments: { current: 1, total: 1 }
  },
  {
    id: '3',
    userId: 'Samuel',
    description: 'Itau Cartão',
    amount: 650,
    type: 'expense',
    category: 'credit_card',
    date: '2024-05-01',
    installments: { current: 1, total: 1 }
  },
  {
    id: '4',
    userId: 'Samuel',
    description: 'Carrefour Cartão',
    amount: 534,
    type: 'expense',
    category: 'credit_card',
    date: '2024-05-01',
    installments: { current: 1, total: 1 }
  },
  {
    id: '5',
    userId: 'Samuel',
    description: 'Cartão BV',
    amount: 593,
    type: 'expense',
    category: 'credit_card',
    date: '2024-05-01',
    installments: { current: 1, total: 1 }
  },
  {
    id: '6',
    userId: 'Samuel',
    description: 'Financiamento BV',
    amount: 1553.68,
    type: 'expense',
    category: 'financing',
    date: '2024-05-01',
    installments: { current: 7, total: 12 }
  },
  {
    id: '7',
    userId: 'Samuel',
    description: 'AP + Comida',
    amount: 2000,
    type: 'expense',
    category: 'home',
    date: '2024-05-01'
  }
];

export const INITIAL_INCOME_SAMUEL = 5000;
export const INITIAL_INCOME_EMLYN = 5000;
