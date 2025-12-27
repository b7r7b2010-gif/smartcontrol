
import { Student, Committee, Teacher } from './types';
import * as XLSX from 'xlsx';

/**
 * ترتيب الطلاب أبجدياً بناءً على الاسم
 */
export const sortStudentsAlphabetically = (students: Student[]): Student[] => {
  return [...students].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
};

/**
 * ترتيب ذكي للمراحل الدراسية (أول ثانوي -> ثاني ثانوي -> ثالث ثانوي)
 */
export const sortByGradeLevel = (students: Student[]): Student[] => {
  const gradeOrder: { [key: string]: number } = {
    'اول': 1, 'أول': 1, '1': 1,
    'ثاني': 2, '2': 2,
    'ثالث': 3, '3': 3
  };

  const getWeight = (grade: string) => {
    for (const key in gradeOrder) {
      if (grade.includes(key)) return gradeOrder[key];
    }
    return 99; // للمراحل غير المعروفة
  };

  return [...students].sort((a, b) => {
    const weightA = getWeight(a.grade);
    const weightB = getWeight(b.grade);
    
    if (weightA !== weightB) return weightA - weightB;
    // إذا كانت نفس المرحلة، نرتب أبجدياً
    return a.name.localeCompare(b.name, 'ar');
  });
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const readWorkbook = async (file: File): Promise<XLSX.WorkBook> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        resolve(workbook);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const getSheetData = (workbook: XLSX.WorkBook, sheetName: string): any[] => {
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

export const parseExcelFile = async (file: File): Promise<any[]> => {
  const workbook = await readWorkbook(file);
  const firstSheetName = workbook.SheetNames[0];
  return getSheetData(workbook, firstSheetName);
};

/**
 * وظيفة لتحويل البيانات الخام بناءً على خريطة الحقول المحددة من قبل المستخدم
 */
export const mapFieldsToStudents = (data: any[], mapping: Record<string, string>): Student[] => {
  return data.map(row => ({
    id: generateId(),
    nationalId: String(row[mapping.nationalId] || ''),
    name: String(row[mapping.name] || ''),
    grade: String(row[mapping.grade] || 'غير محدد'),
    section: String(row[mapping.section] || '1'),
    phone: String(row[mapping.phone] || ''),
    status: 'present' as const
  })).filter(s => s.name.length > 2);
};

export const mapExcelToTeachers = (data: any[]): Teacher[] => {
  return data.map(row => ({
    id: generateId(),
    teacherId: String(row['رقم المعلم'] || row['الرقم الوظيفي'] || row['ID'] || ''),
    name: String(row['اسم المعلم'] || row['الاسم'] || row['Name'] || ''),
    phone: String(row['رقم الجوال'] || row['الجوال'] || row['Phone'] || ''),
    qrCode: `TEACHER:${row['رقم المعلم'] || generateId()}`
  })).filter(t => t.name.length > 3);
};
