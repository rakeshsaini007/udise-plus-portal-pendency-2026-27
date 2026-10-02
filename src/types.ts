export interface SchoolRecord {
  udise: string;
  schoolName: string;
  headmaster: string;
  mobile: string;
  feededStudents: number;
  notFeededStudents: number;
  reason: string;
  isComplete?: boolean;
  updatedAt?: string;
}

export interface DashboardMetrics {
  totalSchools: number;
  completedSchools: number;
  pendingSchools: number;
  totalFeededStudents: number;
  totalNotFeededStudents: number;
  totalStudentsRecorded: number;
  completionRate: number;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  action?: 'saved' | 'updated';
  data?: T;
  schools?: SchoolRecord[];
  metrics?: DashboardMetrics;
  totalCount?: number;
  found?: boolean;
  hasExistingData?: boolean;
}
