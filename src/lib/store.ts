"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import React from "react";
import { fetchCurrentUser, logoutSession } from "@/lib/auth/client";
import { profileService } from "@/lib/services/profile.service";
import type { Profile, AppNotification } from "@/lib/types";

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
  refreshSession: () => Promise<void>;
}

const StoreContext = createContext<StoreState | null>(null);

async function hydrateUserFromSession(): Promise<AuthUser | null> {
  const jwtUser = await fetchCurrentUser();
  if (!jwtUser) return null;

  const { data: profile } = await profileService.getById(jwtUser.id);
  return {
    id: jwtUser.id,
    name: profile?.name ?? jwtUser.user_metadata.full_name ?? jwtUser.email.split("@")[0],
    email: jwtUser.email,
    role: profile?.role ?? "family",
    avatar: (profile as { avatar?: string } | null)?.avatar ?? jwtUser.user_metadata.avatar_url ?? "",
    onboarded: profile?.onboarded ?? false,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const user = await hydrateUserFromSession();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

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
    await logoutSession();
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
        refreshSession,
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
