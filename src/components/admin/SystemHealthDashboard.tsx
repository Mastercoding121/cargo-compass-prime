import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  Database,
  CheckCircle,
  Clock,
  Server,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getSession } from "@/lib/auth";
import { useEffect, useState } from "react";
import { getSystemLogs } from "@/lib/api/health.server";

// Generate chart data from logs
function generateChartData(logs: any[]): { hour: string; count: number }[] {
  const hourlyCounts: Record<string, number> = {};

  for (let i = 0; i < 24; i++) {
    const hourKey = new Date(Date.now() - i * 3600000).getHours().toString().padStart(2, "0");
    hourlyCounts[hourKey] = 0;
  }

  for (const log of logs) {
    if (log.level === "error" && log.metadata?.provider_failed) {
      const logDate = new Date(log.timestamp);
      const hourKey = logDate.getHours().toString().padStart(2, "0");
      hourlyCounts[hourKey] = (hourlyCounts[hourKey] || 0) + 1;
    }
  }

  return Object.entries(hourlyCounts)
    .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
    .reverse();
}

export function SystemHealthDashboard() {
  const [session, setSession] = useState<any>(null);
  const [isPrimaryActive, setIsPrimaryActive] = useState(true);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["system-logs"],
    queryFn: async () => await getSystemLogs({ data: { limit: 20, hours: 24 } }),
    refetchInterval: 30000, // 30 seconds
  });

  const logs = logsData?.success ? logsData.logs : [];
  const chartData = generateChartData(logs);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (session.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="mx-auto w-12 h-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You must be an admin to view this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            System Health & Failover Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status and failover metrics
          </p>
        </div>
        <Badge variant={isPrimaryActive ? "default" : "secondary"} className="text-sm px-4 py-2">
          {isPrimaryActive ? (
            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
          )}
          {isPrimaryActive ? "Primary Active" : "Failover Active"}
        </Badge>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Primary Provider</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Appwrite</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />
              Currently Active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Secondary Provider</CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Supabase</div>
            <p className="text-xs text-muted-foreground mt-1">
              Standby Failover
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failovers (24h)</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter((l: any) => l.level === "error" && l.metadata?.provider_failed).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="w-3 h-3 inline mr-1" />
              Last 24 Hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Failover Frequency Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Failover Frequency (Last 24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ff5000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Failover Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Last 20 Failover Events</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading events...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Timestamp
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Provider Failed
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Query Type
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs
                    .filter((l: any) => l.level === "error" && l.metadata?.provider_failed)
                    .slice(0, 20)
                    .map((log: any) => (
                      <tr key={log.$id} className="border-b">
                        <td className="py-3 px-2 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="destructive" className="capitalize">
                            {log.metadata.provider_failed}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 font-mono text-xs">
                          {log.metadata.query_type}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {log.message}
                        </td>
                      </tr>
                    ))}
                  {logs.filter((l: any) => l.level === "error" && l.metadata?.provider_failed)
                    .length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No failover events recorded in the last 24 hours
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
