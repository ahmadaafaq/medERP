export interface IStudent {
  id: string;
  userId: string;
  rollno: string;
  name: string;
  batchCd?: string;
  courseCd?: string;
  departmentId?: string;
  admissionYear?: number;
  photoUrl?: string;
  phone?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  isActive: boolean;
  createdAt: string;
}

export interface IFaculty {
  id: string;
  userId: string;
  empId: string;
  name: string;
  departmentId?: string;
  designation?: string;
  qualification?: string;
  specialization?: string;
  joiningDate?: string;
  photoUrl?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}
