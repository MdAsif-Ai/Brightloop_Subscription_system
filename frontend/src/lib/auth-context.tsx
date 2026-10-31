"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, UserRole } from "@/types";

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
  demoClock: string;
  setDemoClock: (date: string) => void;
}

const DEFAULT_USER: UserProfile = {
  id: "user-admin",
  name: "Lalith (Executive)",
  email: "admin@brightloop.os",
  business_name: "Brightloop Software Pvt Ltd",
  role: "admin",
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_USER,
  role: "admin",
  setRole: () => {},
  login: () => {},
  logout: () => {},
  demoClock: "2026-10-31",
  setDemoClock: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER);
  const [demoClock, setDemoClockState] = useState<string>("2026-10-31");

  useEffect(() => {
    // Check local storage for persisted role or session
    const saved = localStorage.getItem("brightloop_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    const savedClock = localStorage.getItem("brightloop_clock");
    if (savedClock) {
      setDemoClockState(savedClock);
    }
  }, []);

  const setRole = (role: UserRole) => {
    if (!user) return;
    let name = "Lalith (Executive)";
    let email = "admin@brightloop.os";
    if (role === "staff") {
      name = "Ananya (Billing Specialist)";
      email = "ananya@brightloop.os";
    } else if (role === "customer") {
      name = "Aarav Sharma (Acme Technologies)";
      email = "aarav@acmetech.io";
    }

    const updated: UserProfile = {
      ...user,
      name,
      email,
      role,
      business_name: role === "customer" ? "Acme Technologies" : "Brightloop Software Pvt Ltd",
    };
    setUser(updated);
    localStorage.setItem("brightloop_user", JSON.stringify(updated));
  };

  const login = (email: string, requestedRole: UserRole = "admin") => {
    const isCustomer = requestedRole === "customer" || email.includes("acme") || email.includes("zenith") || email.includes("customer");
    const role: UserRole = isCustomer ? "customer" : requestedRole;
    const name = isCustomer ? "Aarav Sharma" : email.split("@")[0];
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name,
      email,
      business_name: isCustomer ? "Acme Technologies" : "Brightloop Software Pvt Ltd",
      role,
    };
    setUser(newUser);
    localStorage.setItem("brightloop_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("brightloop_user");
  };

  const setDemoClock = (date: string) => {
    setDemoClockState(date);
    localStorage.setItem("brightloop_clock", date);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "admin",
        setRole,
        login,
        logout,
        demoClock,
        setDemoClock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
