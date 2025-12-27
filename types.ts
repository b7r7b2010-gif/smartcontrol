
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

export type ExamDay = {
  id: string;
  date: string;
  subject: string;
};

export type AttendanceLog = {
  studentId: string;
  committeeId: string;
  timestamp: string;
  status: 'present' | 'absent';
  notified: boolean;
};
