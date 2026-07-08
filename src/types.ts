export interface Member {
  firstName: string;
  lastName: string;
}

export interface FormData {
  type: 'individual' | 'grupal';
  members: Member[];
  rut: string;
  firstName: string;
  middleName: string;
  lastName: string;
  secondLastName: string;
  email: string;
  workshop: string;
  projectName: string;
  projectDescription: string;
  materials: string;
}

export interface Submission extends FormData {
  code: string;
  createdAt: string;
}
