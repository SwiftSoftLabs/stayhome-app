"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import React from "react";
import { auth } from "@/lib/insforge";
import type { Profile, AppNotification } from "@/lib/types";

// Re-export for backward compat with existing components
export type { AppNotification as Notification };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  onboarded?: boolean;
}

interface StoreState {
  currentUser: AuthUser | null;
  profile: Profile | null;
  notifications: AppNotification[];
  loading: boolean;
  setProfile: (p: Profile) => void;
  addNotification: (n: Omit<AppNotification, "id" | "read" | "created_at" | "user_id">) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  logout: () => void;
  _setUser: (u: AuthUser | null) => void;
  _setNotifications: (ns: AppNotification[] | ((prev: AppNotification[]) => AppNotification[])) => void;
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    auth.getCurrentUser().then(({ data }) => {
      if (data?.user) {
        const u = data.user;
        setCurrentUser({
          id: u.id,
          name: u.profile?.name ?? u.email.split("@")[0],
          email: u.email,
          role: (u.metadata as Record<string, string>)?.role ?? "family",
          avatar: u.profile?.avatar_url ?? "",
          onboarded: (u.metadata as Record<string, boolean>)?.onboarded ?? false,
        });
      }
      setLoading(false);
    });
  }, []);

  const setProfile = useCallback((p: Profile) => setProfileState(p), []);

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "read" | "created_at" | "user_id">) => {
      const newN: AppNotification = {
        ...n,
        id: crypto.randomUUID(),
        user_id: currentUser?.id ?? "",
        read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [newN, ...prev.slice(0, 49)]);
    },
    [currentUser]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const logout = useCallback(async () => {
    await auth.signOut();
    setCurrentUser(null);
    setProfileState(null);
    setNotifications([]);
  }, []);

  const _setUser = useCallback((u: AuthUser | null) => setCurrentUser(u), []);
  const _setNotifications = useCallback((ns: AppNotification[] | ((prev: AppNotification[]) => AppNotification[])) => setNotifications(ns), []);

  return React.createElement(
    StoreContext.Provider,
    {
      value: {
        currentUser,
        profile,
        notifications,
        loading,
        setProfile,
        addNotification,
        markNotificationRead,
        markAllRead,
        logout,
        _setUser,
        _setNotifications,
      },
    },
    children
  );
}

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
