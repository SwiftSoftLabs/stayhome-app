"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { profileService } from "@/lib/services/profile.service";
import { useStore } from "@/lib/store";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-200"}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const { currentUser, addNotification, setProfile } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notifs, setNotifs] = useState({ email: true, sms: false, push: true });
  const [passwords, setPasswords] = useState({ current: "", new_: "", confirm: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load real profile on mount
  useEffect(() => {
    if (!currentUser) return;
    profileService.getById(currentUser.id).then(({ data }) => {
      if (data) {
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setProfile(data);
      }
      setLoading(false);
    });
  }, [currentUser]);

  const saveProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    const { data, error } = await profileService.upsert({
      id: currentUser.id,
      name: name || null,
      phone: phone || null,
    });
    if (!error && data) {
      setProfile(data);
      addNotification({ title: "Profile Saved", message: "Your profile has been updated.", type: "success" });
    } else {
      addNotification({ title: "Error", message: "Failed to save profile.", type: "error" });
    }
    setSaving(false);
  };

  const changePassword = () => {
    if (!passwords.new_ || passwords.new_ !== passwords.confirm) {
      addNotification({ title: "Error", message: "Passwords do not match.", type: "error" });
      return;
    }
    setPasswords({ current: "", new_: "", confirm: "" });
    addNotification({ title: "Password Changed", message: "Your password has been updated.", type: "success" });
  };

  const initials = (name || currentUser?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}
                  </div>
                ) : (
                  <>
                    <div className="mb-6 flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xl font-bold text-white shadow">
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{name || currentUser?.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{currentUser?.role}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={currentUser?.email ?? ""}
                        disabled
                        className="opacity-60"
                      />
                      <Input
                        label="Phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 000-0000"
                      />
                    </div>
                    <Button className="mt-6" onClick={saveProfile} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
              <CardContent>
                <div className="max-w-md divide-y divide-gray-100">
                  <Toggle label="Email Notifications" checked={notifs.email} onChange={(v) => setNotifs({ ...notifs, email: v })} />
                  <Toggle label="SMS Notifications" checked={notifs.sms} onChange={(v) => setNotifs({ ...notifs, sms: v })} />
                  <Toggle label="Push Notifications" checked={notifs.push} onChange={(v) => setNotifs({ ...notifs, push: v })} />
                </div>
                <Button
                  className="mt-4"
                  onClick={() => addNotification({ title: "Preferences Saved", message: "Notification settings updated.", type: "success" })}
                >
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
              <CardContent>
                <div className="max-w-md space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwords.new_}
                    onChange={(e) => setPasswords({ ...passwords, new_: e.target.value })}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                  <Button onClick={changePassword}>Update Password</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader><CardTitle>Danger Zone</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-gray-500">
                  Once you delete your account, all your data will be permanently removed. This cannot be undone.
                </p>
                {!showDeleteConfirm ? (
                  <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                    Delete Account
                  </Button>
                ) : (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="mb-3 text-sm font-medium text-red-800">
                      Are you sure? This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          addNotification({ title: "Account Scheduled for Deletion", message: "We'll process your request within 30 days.", type: "warning" });
                          setShowDeleteConfirm(false);
                        }}
                      >
                        Yes, Delete My Account
                      </Button>
                      <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
