
export type Student = {
  id: string;
  nationalId: string;
  name: string;
  grade: string;
  section: string;
  phone: string;
  status: 'present' | 'absent' | 'excused';
  committeeId?: string;
  seatNumber?: number;
};

export type Teacher = {
  id: string;
  teacherId: string;
  name: string;
  phone: string;
  qrCode: string;
};

export type Committee = {
  id: string;
  name: string;
  roomName: string;
  capacity: number;
  assignedTeacherIds: string[];
  studentIds: string[];
  examDayId?: string;
};

export type GradeExamConfig = {
  subject: string;
  startTime: string;
  endTime: string;
};

export type ExamPeriod = {
  id: string;
  date: string;
  dayName: string;
  periodName: 'الفترة الأولى' | 'الفترة الثانية';
  isActive: boolean;
  // Mapping grade name to its specific config (subject + times)
  gradeConfigs: Record<string, GradeExamConfig>;
};

export type AttendanceLog = {
  studentId: string;
  committeeId: string;
  timestamp: string;
  status: 'present' | 'absent';
  notified: boolean;
};
