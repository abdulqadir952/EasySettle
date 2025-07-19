
export interface Trip {
  id: string;
  ownerId: string;
  name: string;
  currency: string;
  createdAt: string;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  description?: string;
  startDate?: string;
  endDate?:string;
}

export interface Member {
  id: string;
  name: string;
  phone?: string;
}

export interface ExpenseSplit {
  memberId: string;
  share: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string; // memberId
  splitBetween: { memberId: string; share?: number }[];
  splitType: 'equally' | 'custom';
  notes?: string;
  receiptImageUrl?: string;
  date: string;
  settled: boolean;
}

export interface Settlement {
  id: string;
  from: string; // memberId
  to: string; // memberId
  amount: number;
  notes?: string;
  date: string;
}
