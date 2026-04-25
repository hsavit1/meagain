export type SessionStatus = "scheduled" | "completed" | "cancelled";

export type SessionType = {
  id: string;
  name: string;
  category: string;
  priority: number;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionTypeWithCounts = SessionType & {
  completedCount: number;
  scheduledCount: number;
};

export type Session = {
  id: string;
  sessionTypeId: string;
  title: string;
  date: string;
  startTime: string;
  duration: number;
  endTime: string;
  status: SessionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  sessionType: {
    id: string;
    name: string;
    color: string;
    icon: string;
    priority: number;
  };
};

export type Availability = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
};

export type Suggestion = {
  sessionTypeId: string;
  sessionType: {
    id: string;
    name: string;
    color: string;
    icon: string;
    priority: number;
  };
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  reason: string;
  score: number;
};

export type ProgressSummary = {
  totalScheduled: number;
  totalCompleted: number;
  totalCancelled: number;
  completionRate: number;
  byType: Array<{
    typeId: string;
    name: string;
    color: string;
    completed: number;
    scheduled: number;
    total: number;
  }>;
  avgSpacingDays: number | null;
  currentStreakDays: number;
  longestStreakDays: number;
};

export type ConflictRow = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
};
