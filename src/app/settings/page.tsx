"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const { addNotification } = useStore();
  const [profile, setProfile] = useState({ name: "John Doe", email: "john@example.com", phone: "(555) 123-4567" });
  const [notifs, setNotifs] = useState({ email: true, sms: false, push: true });
  const [twoFactor, setTwoFactor] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new_: "", confirm: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function saveProfile() {
    addNotification({ title: "Profile Saved", message: "Your profile has been updated.", type: "success" });
  }

  function changePassword() {
    if (!passwords.current || !passwords.new_ || passwords.new_ !== passwords.confirm) {
      addNotification({ title: "Error", message: "Passwords do not match or fields are empty.", type: "error" });
      return;
    }
    setPasswords({ current: "", new_: "", confirm: "" });
    addNotification({ title: "Password Changed", message: "Your password has been updated.", type: "success" });
  }

  function deleteAccount() {
    addNotification({ title: "Account Deleted", message: "Your account has been scheduled for deletion.", type: "warning" });
    setShowDeleteConfirm(false);
  }

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

          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                    {profile.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Full Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  <Input label="Email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                  <Input label="Phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <Button className="mt-4" onClick={saveProfile}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
              <CardContent>
                <div className="max-w-md divide-y">
                  <Toggle label="Email Notifications" checked={notifs.email} onChange={(v) => setNotifs({ ...notifs, email: v })} />
                  <Toggle label="SMS Notifications" checked={notifs.sms} onChange={(v) => setNotifs({ ...notifs, sms: v })} />
                  <Toggle label="Push Notifications" checked={notifs.push} onChange={(v) => setNotifs({ ...notifs, push: v })} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
              <CardContent>
                <div className="max-w-md space-y-4">
                  <Input label="Current Password" type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
                  <Input label="New Password" type="password" value={passwords.new_} onChange={(e) => setPasswords({ ...passwords, new_: e.target.value })} />
                  <Input label="Confirm New Password" type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
                  <Button onClick={changePassword}>Update Password</Button>
                </div>
                <div className="mt-6 border-t pt-6">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">Two-Factor Authentication</h4>
                  <Toggle label="Enable two-factor authentication" checked={twoFactor} onChange={setTwoFactor} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader><CardTitle>Delete Account</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-gray-500">Once you delete your account, all data will be permanently removed. This action cannot be undone.</p>
                {!showDeleteConfirm ? (
                  <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>Delete Account</Button>
                ) : (
                  <div className="rounded-md border border-red-200 bg-red-50 p-4">
                    <p className="mb-3 text-sm font-medium text-red-800">Are you sure? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <Button variant="destructive" onClick={deleteAccount}>Yes, Delete</Button>
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
