/* ROUTE_KEY: Admin Users Management */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRAND } from "@/config/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, Plus, Edit2, Wallet, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: `Manage Users — ${BRAND.name}` }] }),
  component: AdminUsers,
});

// Mock user data
interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "customer";
  handleId: string;
  walletBalance: number;
  createdAt: string;
}

function getMockUsers(): User[] {
  return [
    {
      id: "user-001",
      email: "admin@nextgenhub.ng",
      name: "Admin User",
      role: "admin",
      handleId: "NH-ADMIN-001",
      walletBalance: 150000,
      createdAt: "2026-01-15",
    },
    {
      id: "user-002",
      email: "john.doe@example.com",
      name: "John Doe",
      role: "customer",
      handleId: "NH-A1B2C3",
      walletBalance: 45000,
      createdAt: "2026-03-20",
    },
    {
      id: "user-003",
      email: "adebayo.oke@example.com",
      name: "Adebayo Oke",
      role: "customer",
      handleId: "NH-D4E5F6",
      walletBalance: 120000,
      createdAt: "2026-04-05",
    },
    {
      id: "user-004",
      email: "fatima.abubakar@example.com",
      name: "Fatima Abubakar",
      role: "customer",
      handleId: "NH-G7H8I9",
      walletBalance: 8500,
      createdAt: "2026-05-12",
    },
    {
      id: "user-005",
      email: "emeka.onyeka@example.com",
      name: "Emeka Onyeka",
      role: "customer",
      handleId: "NH-J0K1L2",
      walletBalance: 0,
      createdAt: "2026-06-01",
    },
  ];
}

function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("0");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add");

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setUsers(getMockUsers());
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    toast.success("User updated successfully!");
    setIsEditDialogOpen(false);
  };

  const handleAdjustWallet = () => {
    if (!selectedUser) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    let newBalance = selectedUser.walletBalance;
    if (adjustmentType === "add") {
      newBalance += amount;
    } else {
      if (amount > selectedUser.walletBalance) {
        toast.error("Insufficient balance for this adjustment");
        return;
      }
      newBalance -= amount;
    }

    const updatedUser = { ...selectedUser, walletBalance: newBalance };
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    toast.success(`Wallet ${adjustmentType}ed ₦${amount.toLocaleString()} successfully!`);
    setIsWalletDialogOpen(false);
    setAdjustAmount("0");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-slate-400">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Users</h1>
          <p className="text-slate-500 mt-2">View, edit, and adjust user accounts</p>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Handle</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Wallet Balance</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">{user.email}</TableCell>
                  <TableCell className="text-sm">{user.handleId}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₦{user.walletBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {user.createdAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(user);
                          setAdjustAmount("0");
                          setIsWalletDialogOpen(true);
                        }}
                      >
                        <Wallet className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  defaultValue={selectedUser.name}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  defaultValue={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button onClick={() => handleSaveUser(selectedUser)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Wallet Adjustment Dialog */}
      {selectedUser && (
        <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Wallet Balance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Current Balance
                </label>
                <Input
                  disabled
                  value={`₦${selectedUser.walletBalance.toLocaleString()}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Adjustment Type
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={adjustmentType === "add" ? "default" : "ghost"}
                    onClick={() => setAdjustmentType("add")}
                  >
                    Add Funds
                  </Button>
                  <Button
                    variant={adjustmentType === "subtract" ? "default" : "ghost"}
                    onClick={() => setAdjustmentType("subtract")}
                  >
                    Subtract Funds
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <Input
                  type="number"
                  min="0"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAdjustWallet}>
                Adjust Wallet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
