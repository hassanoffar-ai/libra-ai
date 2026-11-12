export type UserRole = "admin" | "oxucu" | "librarian" | "reader";

export type ReaderUserCategory = "Tələbə" | "Müəllim" | "Əməkdaş";
export type ReaderRole = "student" | "teacher" | "staff";
export type UserAccessRole = "reader" | "librarian";
export type UserStatus = "pending" | "active" | "blocked" | "Aktiv" | "Bloklanıb";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  accessRole?: UserAccessRole;
  category: ReaderUserCategory;
  categoryRole?: ReaderRole;
  firstName: string;
  lastName: string;
  phone: string;
  department?: string;
  ticketNumber?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user?: UserProfile;
  error?: string;
}

