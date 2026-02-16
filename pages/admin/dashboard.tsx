// pages/admin/dashboard.tsx
"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { adminGuard } from "@/lib/adminGuard";
import type { GetServerSideProps } from "next";
export const getServerSideProps: GetServerSideProps = async (ctx) =>
  adminGuard(ctx, async () => ({ props: {} }));

// Types
interface Stats {
  totalSales: number;
  totalOrders: number;
  newCustomers: number;
  topProducts: Array<{ name: string; sold: number }>;
}

type DailySales = { date: string; totalSales: number };
type DailyOrders = { date: string; orderCount: number };

// Graph types
type GraphType =
  | "salesTrend"
  | "stockSupplier"
  | "ordersByCity"
  | "salesByCategory";
type SalesData = Array<{ date: string; totalSales: number }>;
type StockData = Array<{ companyName: string; stock: number }>;
type CityData = Array<{ city: string; orderCount: number }>;
type CategoryData = Array<{ category: string; totalSales: number }>;

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  // Daily metrics
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [dailySales, setDailySales] = useState<DailySales | null>(null);
  const [dailyOrders, setDailyOrders] = useState<DailyOrders | null>(null);

  // Graph selection
  const [selectedGraph, setSelectedGraph] = useState<GraphType>("salesTrend");
  const [graphData, setGraphData] = useState<
    SalesData | StockData | CityData | CategoryData
  >([]);

  // Load main stats
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  // Load daily sales/orders
  useEffect(() => {
    fetch(`/api/admin/sales-by-date?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data: DailySales) => setDailySales(data))
      .catch(console.error);

    fetch(`/api/admin/orders-by-date?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data: DailyOrders) => setDailyOrders(data))
      .catch(console.error);
  }, [selectedDate]);

  // Load graph data based on selection
  useEffect(() => {
    let url = "";
    switch (selectedGraph) {
      case "salesTrend":
        url = "/api/admin/sales-trend";
        break;
      case "stockSupplier":
        url = "/api/admin/stock-by-supplier";
        break;
      case "ordersByCity":
        url = "/api/admin/orders-by-city";
        break;
      case "salesByCategory":
        url = "/api/admin/sales-by-category";
        break;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => setGraphData(data))
      .catch(console.error);
  }, [selectedGraph]);

  if (!stats) return <div>Loading...</div>;

  return (
    <AdminLayout>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>ยอดขายทั้งหมด</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ฿{stats.totalSales.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>จำนวนออร์เดอร์ทั้งหมด</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>ลูกค้าใหม่ (30 วัน)</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.newCustomers}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>สินค้าขายดี (Top 5)</CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {stats.topProducts.map((p) => (
                <li key={p.name} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="font-semibold">{p.sold}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>ยอดขาย &amp; ออเดอร์รายวัน</CardHeader>
          <CardContent>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded p-1 mb-3 w-full"
            />

            {dailySales && (
              <p className="mb-2">
                ยอดขาย: ฿
                <span className="font-semibold">
                  {dailySales.totalSales.toLocaleString()}
                </span>
              </p>
            )}

            {dailyOrders && (
              <p>
                จำนวนออเดอร์:
                <span className="font-semibold">{dailyOrders.orderCount}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graph Selector & Chart */}
      <Card className="mt-6 lg:col-span-4">
        <CardHeader>กราฟข้อมูล</CardHeader>
        <CardContent className="h-[400px]">
          <div className="mb-4 flex items-center gap-4">
            <label htmlFor="graph-select" className="font-medium">
              เลือกกราฟ:
            </label>
            <select
              id="graph-select"
              value={selectedGraph}
              onChange={(e) => setSelectedGraph(e.target.value as GraphType)}
              className="border rounded px-2 py-1"
            >
              <option value="salesTrend">ยอดขายตามเวลา</option>
              <option value="stockSupplier">สต็อกตามผู้จัดจำหน่าย</option>
              <option value="ordersByCity">ออเดอร์ตามเมือง</option>
              <option value="salesByCategory">ยอดขายตามหมวดหมู่</option>
            </select>
          </div>

          {selectedGraph === "salesTrend" && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData as SalesData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalSales"
                  name="ยอดขาย"
                  stroke="#8884d8"
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {selectedGraph === "stockSupplier" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData as StockData}>
                <XAxis dataKey="companyName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock" name="สต็อก" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {selectedGraph === "ordersByCity" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData as CityData}>
                <XAxis dataKey="city" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orderCount" name="จำนวนออเดอร์" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {selectedGraph === "salesByCategory" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData as CategoryData}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalSales" name="ยอดขาย" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
