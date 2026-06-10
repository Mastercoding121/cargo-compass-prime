/* ROUTE_KEY: Admin Pending Scraping Queue */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRAND } from "@/config/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/fx";

export const Route = createFileRoute("/admin/pending")({
  head: () => ({ meta: [{ title: `Pending Scraping Queue - ${BRAND.name}` }] }),
  component: AdminPending,
});

interface PendingItem {
  $id: string;
  original_1688_link: string;
  requested_at: string;
  user_id?: string;
  is_processed: boolean;
  title_english?: string;
  image_url?: string;
  price_yuan?: number;
  price_naira?: number;
  source?: string;
}

function AdminPending() {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock pending items
    const timer = setTimeout(() => {
      setPendingItems([
        {
          $id: "1",
          original_1688_link: "https://1688.com/product/1",
          requested_at: new Date(Date.now() - 3600000).toISOString(),
          user_id: "user_1",
          is_processed: false,
          title_english: "Wireless Bluetooth Headphones",
          image_url: "https://picsum.photos/200/200?random=100",
          price_yuan: 59.99,
          price_naira: 59.99 * 280,
          source: "ai_sourced",
        },
        {
          $id: "2",
          original_1688_link: "https://1688.com/product/2",
          requested_at: new Date(Date.now() - 7200000).toISOString(),
          user_id: "user_2",
          is_processed: true,
        },
      ]);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleApproveItem = async (item: PendingItem) => {
    toast.success(`Approved: ${item.title_english || item.original_1688_link}`);
    setPendingItems(pendingItems.map((i) =>
      i.$id === item.$id ? { ...i, is_processed: true } : i
    ));
  };

  const handleDeleteItem = (item: PendingItem) => {
    setPendingItems(pendingItems.filter((i) => i.$id !== item.$id));
    toast.success("Item removed from queue");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-slate-400">Loading pending items...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Pending Scraping Queue</h1>
        <p className="text-slate-500 mt-2">Review and approve products requested by users</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingItems.map((item) => (
                <TableRow key={item.$id}>
                  <TableCell>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title_english || "Product"}
                        className="w-12 h-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-xs">
                    {item.title_english || "No title provided"}
                  </TableCell>
                  <TableCell>
                    {item.price_naira && (
                      <div className="space-y-1">
                        <p className="font-semibold text-orange-600">
                          {formatNGN(item.price_naira)}
                        </p>
                        {item.price_yuan && (
                          <p className="text-xs text-muted-foreground">
                            ¥{item.price_yuan.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.source === "ai_sourced" ? (
                      <Badge variant="default" className="bg-blue-500">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Sourced
                      </Badge>
                    ) : (
                      <Badge variant="outline">Manual</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(item.requested_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {item.is_processed ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Processed
                      </span>
                    ) : (
                      <span className="text-yellow-600">Pending</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!item.is_processed && item.title_english && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveItem(item)}
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteItem(item)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
