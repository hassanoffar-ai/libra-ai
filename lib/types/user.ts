export type UserRole = "admin" | "oxucu";

export type ReaderUserCategory = "Tələbə" | "Müəllim";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  category: ReaderUserCategory;
  ticketNumber?: string; // Məs: OX-1001
  status: "Aktiv" | "Bloklanıb";
  createdAt: string;
  updatedAt: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user?: UserProfile;
  error?: string;
}

