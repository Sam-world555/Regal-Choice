import { API_URL } from "../config";
import { useEffect, useState } from "react";
import axios from "axios";
import "../Admin.css";
import "../Dashboard.css";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const token = sessionStorage.getItem("token");

      const { data } = await axios.get(
        API_URL + "/api/dashboard/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStats(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case "Delivered":
        return "status-pill status-delivered";
      case "Shipped":
        return "status-pill status-shipped";
      case "Processing":
        return "status-pill status-processing";
      case "Cancelled":
        return "status-pill status-cancelled";
      default:
        return "status-pill status-pending";
    }
  };

  if (loading || !stats) {
    return <p className="empty-note">Loading dashboard...</p>;
  }

  return (
    <>
      <div className="admin-stats">
        <div className="stat-card">
          <p className="stat-label">📦 Products</p>
          <h1 className="stat-value stat-blue">{stats.totalProducts}</h1>
        </div>

        <div className="stat-card">
          <p className="stat-label">🛒 Orders</p>
          <h1 className="stat-value stat-green">{stats.totalOrders}</h1>
        </div>

        <div className="stat-card">
          <p className="stat-label">💰 Revenue</p>
          <h1 className="stat-value stat-wine">
            ₹{stats.totalRevenue.toLocaleString()}
          </h1>
        </div>

        <div className="stat-card">
          <p className="stat-label">👤 Customers</p>
          <h1 className="stat-value stat-purple">{stats.totalUsers}</h1>
        </div>

        <div className="stat-card">
          <p className="stat-label">⚠️ Out of Stock</p>
          <h1 className="stat-value stat-red">{stats.outOfStockCount}</h1>
        </div>
      </div>

      <div className="dashboard-chart-panel">
        <h2 className="panel-title">Revenue — Last 6 Months</h2>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={stats.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e3dc" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#6b6560" }}
            />
            <YAxis tick={{ fontSize: 12, fill: "#6b6560" }} />
            <Tooltip
              formatter={(value) => [`₹${value}`, "Revenue"]}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e7e3dc",
                fontSize: 13,
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#7a1f3d"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#7a1f3d" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h2 className="panel-title">Low Stock Alert</h2>

          {stats.lowStockProducts.length === 0 ? (
            <p className="empty-note">No products running low.</p>
          ) : (
            <div className="dashboard-list">
              {stats.lowStockProducts.map((p) => (
                <div key={p._id} className="dashboard-list-row">
                  <img
                    src={p.image || "/no-image.png"}
                    alt={p.name}
                    className="dashboard-list-image"
                  />
                  <span className="dashboard-list-name">{p.name}</span>
                  <span className="admin-stock-low">{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <h2 className="panel-title">Top Selling Products</h2>

          {stats.topProducts.length === 0 ? (
            <p className="empty-note">No sales data yet.</p>
          ) : (
            <div className="dashboard-list">
              {stats.topProducts.map((p) => (
                <div key={p._id} className="dashboard-list-row">
                  <img
                    src={p.image || "/no-image.png"}
                    alt={p.name}
                    className="dashboard-list-image"
                  />
                  <span className="dashboard-list-name">{p.name}</span>
                  <span className="dashboard-list-count">
                    {p.totalSold} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-panel dashboard-panel-full">
        <h2 className="panel-title">Recent Orders</h2>

        {stats.recentOrders.length === 0 ? (
          <p className="empty-note">No orders yet.</p>
        ) : (
          <div className="dashboard-list">
            {stats.recentOrders.map((order) => (
              <div key={order._id} className="dashboard-order-row">
                <span className="dashboard-order-id">
                  #{order._id.slice(-6)}
                </span>
                <span className="dashboard-order-user">{order.userName}</span>
                <span className="dashboard-order-total">
                  ₹{order.totalPrice}
                </span>
                <span className={getStatusClass(order.status)}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AdminDashboard;