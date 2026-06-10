/* ROUTE_KEY: Dashboard Orders Page */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { createMockOrders } from "@/lib/orders.server";
import {
  ORDER_STATUS_CONFIG,
  SECTION_CONFIG,
  type Order,
} from "@/lib/orders";
import { Package } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/fx";

export const Route = createFileRoute("/dashboard/orders")({
  component: DashboardOrders,
});

function DashboardOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const session = await getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const mockOrders = createMockOrders(session.id);
      setOrders(mockOrders);
      setLoading(false);
    }
    loadOrders();
  }, [navigate]);

  const handlePayNow = (orderId: string) => {
    toast.success("Payment processed successfully!");
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "PAID" } : o
      )
    );
  };

  const handleAction = (orderId: string, status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        handlePayNow(orderId);
        break;
      case "CHINA_WAREHOUSE":
        toast.info("Opening inspection photos...");
        break;
      case "TO_BE_CONFIRMED":
        toast.info("Opening shipping selection...");
        break;
      case "PENDING_PICKUP":
        toast.info("Opening pickup details...");
        break;
      default:
        toast.info("Action not available yet");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-muted-foreground">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Track your procurement and shipping journey
        </p>
      </div>

      {SECTION_CONFIG.map((section) => {
        const sectionOrders = orders.filter(
          (o) => ORDER_STATUS_CONFIG[o.status].section === section.id
        );
        if (sectionOrders.length === 0) return null;

        return (
          <div key={section.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{section.icon}</span>
              <h2 className="text-lg font-semibold tracking-wider text-slate-700">
                {section.label}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sectionOrders.map((order) => {
                const statusConfig = ORDER_STATUS_CONFIG[order.status];

                return (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(order.createdAt)} · {order.items.length}{" "}
                            item{order.items.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {formatNGN(order.totalNairaAmount)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: statusConfig.color }}
                          />
                          <span
                            className="font-medium"
                            style={{ color: statusConfig.color }}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        {statusConfig.requiresAction &&
                          statusConfig.actionText && (
                            <Button
                              className="ml-auto"
                              style={{
                                backgroundColor: "#ff5000",
                                color: "white",
                              }}
                              onClick={() => handleAction(order.id, order.status)}
                            >
                              {statusConfig.actionText}
                            </Button>
                          )}
                      </div>

                      <div className="flex gap-2 overflow-x-auto">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex-shrink-0 w-16 h-16 rounded border border-slate-200 bg-slate-50 flex items-center justify-center"
                          >
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-12 h-12 object-contain"
                              onError={(e) =>
                                (e.currentTarget.src =
                                  "https://placehold.co/48x48")
                              }
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {order.chinaWaybillNumber && (
                          <span>
                            <Package className="size-3 inline mr-1" />
                            China: {order.chinaWaybillNumber}
                          </span>
                        )}
                        {order.localWaybillNumber && (
                          <>
                            <span>•</span>
                            <span>
                              🇳🇬 Local: {order.localWaybillNumber}
                            </span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {orders.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="mx-auto w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No orders yet
            </h3>
            <p className="text-slate-500 mb-4">
              Start shopping from 1688 to create your first order
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
