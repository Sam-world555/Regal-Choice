const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// GET /api/dashboard/stats (admin only)
const getDashboardStats = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product");

    const products = await Product.find();

    const totalUsers = await User.countDocuments();

    // --- Basic counts ---
    const totalProducts = products.length;
    const totalOrders = orders.length;

    // Only count revenue from orders that aren't cancelled
    const validOrders = orders.filter(
      (order) => order.status !== "Cancelled"
    );

    const totalRevenue = validOrders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );

    // --- Low stock products (stock <= 5, excluding fully out of stock) ---
    const lowStockProducts = products
      .filter((p) => p.stock > 0 && p.stock <= 5)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        image: p.image,
        stock: p.stock,
      }));

    const outOfStockCount = products.filter((p) => !p.stock || p.stock <= 0)
      .length;

    // --- Top selling products (by total quantity sold across all orders) ---
    const salesMap = {};

    validOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!item.product) return;

        const id = item.product._id.toString();

        if (!salesMap[id]) {
          salesMap[id] = {
            _id: item.product._id,
            name: item.product.name,
            image: item.product.image,
            totalSold: 0,
          };
        }

        salesMap[id].totalSold += item.quantity;
      });
    });

    const topProducts = Object.values(salesMap)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    // --- Recent orders (latest 5) ---
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((order) => ({
        _id: order._id,
        userName: order.user?.name || "Unknown",
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
      }));

    // --- Monthly revenue (last 6 months) ---
    const monthlyRevenueMap = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyRevenueMap[key] = {
        label: d.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        revenue: 0,
      };
    }

    validOrders.forEach((order) => {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;

      if (monthlyRevenueMap[key]) {
        monthlyRevenueMap[key].revenue += order.totalPrice || 0;
      }
    });

    const monthlyRevenue = Object.values(monthlyRevenueMap);

    res.status(200).json({
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      outOfStockCount,
      lowStockProducts,
      topProducts,
      recentOrders,
      monthlyRevenue,
    });
  } catch (error) {
    console.log("DASHBOARD STATS ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};