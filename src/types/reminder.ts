export interface Reminder {
  id: string;
  userId: string;
  title: string;
  originalInput: string;
  dueTimestamp: number;
  dueDateString: string;
  completed: boolean;
  completedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}
