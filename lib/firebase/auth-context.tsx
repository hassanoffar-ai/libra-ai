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
      // 1. Check ID token custom claims first
      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      let userRole: UserRole = (idTokenResult.claims.role as UserRole) || "oxucu";

      // 2. Fetch Firestore profile
      const userRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        if (data.role === "admin") userRole = "admin";
        setProfile(data);
      } else {
        // Fallback profile
        const fallbackProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          role: userRole,
          firstName: firebaseUser.displayName?.split(" ")[0] || "İstifadəçi",
          lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
          phone: "",
          category: "Tələbə",
          status: "Aktiv",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
      }

      setRole(userRole);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
        setRole(null);
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

      // 2. Establish server session & check portal permission
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          requestedPortal: portal,
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

      await fetchProfile(userCred.user);
      return {
        success: true,
        role: data.user?.role || "oxucu",
      };
    } catch (err: any) {
      console.error("Firebase login error:", err);
      let errorMsg = "E-poçt və ya şifrə yanlışdır.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        errorMsg = "E-poçt və ya şifrə yanlışdır.";
      } else if (err.code === "auth/too-many-requests") {
        errorMsg = "Çox sayda uğursuz cəhd. Zəhmət olmasa bir az sonra yenidən yoxlayın.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      setRole(null);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin: role === "admin",
        isReader: role === "oxucu",
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

