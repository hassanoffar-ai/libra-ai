"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./client";
import { UserProfile, UserRole } from "@/lib/types/user";

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isReader: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, portal?: "admin" | "oxucu") => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCategory: (newCategory: "Tələbə" | "Müəllim") => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  isAdmin: false,
  isReader: false,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshProfile: async () => {},
  updateCategory: async () => ({ success: false }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (firebaseUser: FirebaseUser) => {
    try {
      // In this system, Firebase Authentication is strictly reserved for Librarians / Admins
      let userRole: UserRole = "admin";

      // 1. Fetch Firestore profile if it exists
      const userRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        userRole = "admin";
        setProfile({
          ...data,
          role: "admin",
          accessRole: "librarian",
        });
      } else {
        // Fallback admin profile
        const nameParts = (firebaseUser.displayName || "").trim().split(" ");
        const firstName = nameParts[0] || "Administrator";
        const lastName = nameParts.slice(1).join(" ") || "";
        const fallbackProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          role: "admin",
          accessRole: "librarian",
          firstName,
          lastName,
          phone: "",
          category: "Müəllim",
          categoryRole: "teacher",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(fallbackProfile);

        try {
          await setDoc(userRef, fallbackProfile, { merge: true });
        } catch {
          // ignore if client permissions restrict writing
        }
      }

      setRole("admin");

      // Mark admin session in localStorage and cookies for instant client & middleware checks
      if (typeof window !== "undefined") {
        localStorage.setItem("libra_admin_session", "true");
        document.cookie = "libra_admin_session=true; path=/; max-age=432000; SameSite=Lax";
        document.cookie = "libra_role=admin; path=/; max-age=432000; SameSite=Lax";
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setRole("admin");
      if (typeof window !== "undefined") {
        localStorage.setItem("libra_admin_session", "true");
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
        // Only clear role if no local admin flag
        const hasLocalAdmin = typeof window !== "undefined" && localStorage.getItem("libra_admin_session") === "true";
        if (!hasLocalAdmin) {
          setRole(null);
        } else {
          setRole("admin");
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (
    email: string,
    pass: string,
    portal?: "admin" | "oxucu"
  ): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    try {
      // 1. Firebase Authentication sign in
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const idToken = await userCred.user.getIdToken();

      // 2. Set client-side admin session flags
      if (typeof window !== "undefined") {
        localStorage.setItem("libra_admin_session", "true");
        document.cookie = "libra_admin_session=true; path=/; max-age=432000; SameSite=Lax";
        document.cookie = "libra_role=admin; path=/; max-age=432000; SameSite=Lax";
      }

      // 3. Establish server session & check portal permission
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          requestedPortal: portal || "admin",
        }),
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        console.error("Non-JSON response from /api/auth/session:", await response.text().catch(() => ""));
        return {
          success: false,
          error: "Sessiya xətası baş verdi. Zəhmət olmasa yenidən cəhd edin.",
        };
      }

      if (!response.ok) {
        // If rejected on server, sign out from client auth
        if (typeof window !== "undefined") {
          localStorage.removeItem("libra_admin_session");
          document.cookie = "libra_admin_session=; path=/; max-age=0";
        }
        await firebaseSignOut(auth);
        setUser(null);
        setProfile(null);
        setRole(null);
        return {
          success: false,
          error: data.error || "Giriş icazəsi yoxdur.",
          role: data.role,
        };
      }

      setRole("admin");
      if (data.user) {
        setProfile({ ...data.user, role: "admin", accessRole: "librarian" });
      }
      await fetchProfile(userCred.user);
      return {
        success: true,
        role: "admin",
      };
    } catch (err: any) {
      console.error("Firebase login error:", err);
      let errorMsg = "E-poçt və ya şifrə yanlışdır.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        errorMsg = "E-poçt və ya şifrə yanlışdır.";
      } else if (err.code === "auth/too-many-requests") {
        errorMsg = "Çox sayda uğursuz cəhd. Zəhmət olmasa bir az sonra yenidən yoxlayyn.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("libra_admin_session");
        document.cookie = "libra_admin_session=; path=/; max-age=0";
        document.cookie = "libra_role=; path=/; max-age=0";
        document.cookie = "libra_session=; path=/; max-age=0";
      }
      await fetch("/api/auth/logout", { method: "POST" });
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      setRole(null);
      window.location.href = "/admin";
    } catch (err) {
      console.error("Logout error:", err);
      window.location.href = "/admin";
    }
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await fetchProfile(auth.currentUser);
    }
  };

  const updateCategory = async (newCategory: "Tələbə" | "Müəllim"): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser) return { success: false, error: "İstifadəçi daxil olmayıb." };
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userRef, { category: newCategory, updatedAt: new Date().toISOString() }, { merge: true });
      setProfile((prev) => (prev ? { ...prev, category: newCategory } : null));
      return { success: true };
    } catch (err: any) {
      console.error("Error updating category:", err);
      return { success: false, error: err?.message || "Xəta baş verdi." };
    }
  };

  const hasLocalAdmin = typeof window !== "undefined" && localStorage.getItem("libra_admin_session") === "true";
  const isAdmin = role === "admin" || (role as string) === "librarian" || Boolean(user) || hasLocalAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: role || (hasLocalAdmin ? "admin" : null),
        isAdmin,
        isReader: !isAdmin && role === "oxucu",
        isLoading,
        login,
        logout,
        refreshProfile,
        updateCategory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

