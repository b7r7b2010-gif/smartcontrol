
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
  assignedTeacherIds: string[]; // This might become per-session assignment
  studentIds: string[];
  examDayId?: string;
};

export type ExamPeriod = {
  id: string;
  date: string;
  dayName: string;
  periodName: 'الفترة الأولى' | 'الفترة الثانية';
  startTime: string;
  endTime: string;
  isActive: boolean;
  subjects: Record<string, string>; // Mapping grade level to subject name
};

export type AttendanceLog = {
  studentId: string;
  committeeId: string;
  timestamp: string;
  status: 'present' | 'absent';
  notified: boolean;
};
