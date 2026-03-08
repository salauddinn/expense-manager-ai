import { CategoryType } from '@/types/finance';

export const EXPENSE_CATEGORIES: { value: CategoryType; label: string; icon: string }[] = [
  { value: 'food', label: 'Food & Dining', icon: '🍔' },
  { value: 'groceries', label: 'Groceries', icon: '🛒' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'bills', label: 'Bills & Utilities', icon: '💡' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'health', label: 'Health', icon: '🏥' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'rent', label: 'Rent', icon: '🏠' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export const INCOME_CATEGORIES: { value: CategoryType; label: string; icon: string }[] = [
  { value: 'salary', label: 'Salary', icon: '💰' },
  { value: 'freelance', label: 'Freelance', icon: '💻' },
  { value: 'investment', label: 'Investment', icon: '📈' },
  { value: 'gift', label: 'Gift', icon: '🎁' },
  { value: 'refund', label: 'Refund', icon: '↩️' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES.filter(
  (ic) => !EXPENSE_CATEGORIES.find((ec) => ec.value === ic.value)
)];

export function getCategoryInfo(category: CategoryType) {
  return ALL_CATEGORIES.find((c) => c.value === category) ?? { value: 'other', label: 'Other', icon: '📦' };
}
