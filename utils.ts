
import { Student, Committee, Teacher } from './types';
import * as XLSX from 'xlsx';

/**
 * ترتيب ذكي للمراحل الدراسية (أول ثانوي -> ثاني ثانوي -> ثالث ثانوي)
 * مع ترتيب أبجدي للأسماء داخل كل مرحلة
 */
export const sortByGradeLevel = (students: Student[]): Student[] => {
  const gradeOrder: { [key: string]: number } = {
    'اول': 1, 'أول': 1, '1': 1, 'primary_1': 1,
    'ثاني': 2, '2': 2, 'primary_2': 2,
    'ثالث': 3, '3': 3, 'primary_3': 3,
    'رابع': 4, '4': 4,
    'خامس': 5, '5': 5,
    'سادس': 6, '6': 6
  };

  const getWeight = (grade: string) => {
    const g = String(grade).toLowerCase();
    for (const key in gradeOrder) {
      if (g.includes(key)) return gradeOrder[key];
    }
    return 99; 
  };

  return [...students].sort((a, b) => {
    const weightA = getWeight(a.grade);
    const weightB = getWeight(b.grade);
    
    // أولاً: الترتيب حسب الصف
    if (weightA !== weightB) return weightA - weightB;
    
    // ثانياً: الترتيب الأبجدي داخل نفس الصف
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
 * دالة محسنة لاستيراد الطلاب مع ضمان جودة البيانات ورقم الجوال
 */
export const mapFieldsToStudents = (data: any[], mapping: Record<string, string>): Student[] => {
  return data.map(row => {
    // محاولة جلب القيمة سواء كان الحقل نصياً أو رقماً في الإكسل
    const getVal = (key: string) => row[mapping[key]] !== undefined ? String(row[mapping[key]]).trim() : '';
    
    return {
      id: generateId(),
      nationalId: getVal('nationalId'),
      name: getVal('name'),
      grade: getVal('grade') || 'غير محدد',
      section: getVal('section') || '1',
      phone: getVal('phone'),
      status: 'present' as const
    };
  }).filter(s => s.name.length > 2);
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
