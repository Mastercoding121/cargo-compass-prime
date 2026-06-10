/* ROUTE_KEY: User Profile Page */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRAND } from "@/config/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSession, setSession } from "@/lib/auth";
import { User, Wallet, LogOut, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: `Profile — ${BRAND.name}` }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      Route.navigate({ to: "/login" });
      return;
    }
    setUser(session);
    setEditName(session.name);
  }, []);

  const handleSaveProfile = () => {
    const updatedUser = { ...user, name: editName };
    setSession(updatedUser);
    setUser(updatedUser);
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-500 mt-2">Manage your account details</p>
          </div>
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5 text-slate-600" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(user.name);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Full Name</p>
                    <p className="text-lg font-medium">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="text-lg font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Account Handle</p>
                    <p className="text-lg font-mono">{user.handleId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Role</p>
                    <p className="text-lg font-medium capitalize">{user.role}</p>
                  </div>
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="size-5 text-slate-600" />
                Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <p className="text-sm text-orange-700">Available Balance</p>
                <p className="text-2xl font-bold text-orange-700">₦0.00</p>
              </div>
              <Button
                className="w-full"
                style={{ backgroundColor: "#ff5000", color: "white" }}
              >
                Top Up Wallet
              </Button>
              <div className="mt-2">
                <p className="text-xs text-slate-500">
                  <AlertCircle className="size-3 inline mr-1" />
                  Wallet functionality is a work in progress
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* WIP Notice */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">
            <AlertCircle className="size-4 inline mr-2" />
            Profile page is a work in progress. More features coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
