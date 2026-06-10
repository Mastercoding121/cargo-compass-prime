/* ROUTE_KEY: Admin Dashboard Summary */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRAND } from "@/config/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Users, CreditCard, ArrowRight, PackageSearch, Activity } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: `Admin Dashboard — ${BRAND.name}` }] }),
  component: AdminDashboard,
});

// Mock data for admin dashboard
function getAdminStats() {
  return {
    totalOrders: 1245,
    totalUsers: 892,
    pendingPayments: 34,
    totalRevenue: 28475000, // NGN
  };
}

function AdminDashboard() {
  const [stats, setStats] = useState(getAdminStats());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-2">Overview of NextGen Hub operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">+8% from last month</p>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.pendingPayments}
            </div>
            <p className="text-xs text-slate-500 mt-1">Requires attention</p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="h-4 w-4 text-emerald-600">₦</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ₦{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">+18% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/admin/users">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-600" />
                Manage Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 mb-4">View, edit, and adjust user accounts</p>
              <Button className="flex items-center gap-2">
                Go to Users <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/products">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-slate-600" />
                Manage Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 mb-4">Add, edit, or delete products from the cache</p>
              <Button className="flex items-center gap-2">
                Go to Products <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/pending">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-amber-200/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PackageSearch className="h-5 w-5 text-amber-600" />
                Pending Scraping Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 mb-4">Review and approve products requested by users</p>
              <Button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700">
                Go to Queue <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/health">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-indigo-200/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                System Health Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 mb-4">View real-time status and failover metrics</p>
              <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                Go to Monitor <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
