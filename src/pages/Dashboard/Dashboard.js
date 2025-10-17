import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  ShoppingCart as OrderIcon,
  LocalGroceryStore as GroceryIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { restaurantService, orderService, groceryService } from '../../services/firestoreService';
import { toast } from 'react-toastify';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalOrders: 0,
    totalGroceryItems: 0,
    totalSales: 0,
  });
  const [salesData, setSalesData] = useState([]);
  const [orderTypeData, setOrderTypeData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Helper function to safely convert Firestore timestamp to Date
  const getDateFromTimestamp = (timestamp) => {
    if (!timestamp) return new Date(0); // Return epoch for null/undefined
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate(); // Firestore Timestamp
    }
    if (timestamp instanceof Date) {
      return timestamp; // Already a Date object
    }
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      return new Date(timestamp); // String or number timestamp
    }
    return new Date(0); // Fallback
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [restaurants, orders, groceryItems, groceryOrders] = await Promise.all([
        restaurantService.getRestaurants(),
        orderService.getOrders(),
        groceryService.getGroceryItems(),
        groceryService.getGroceryOrders()
      ]);

      console.log('Restaurants Data ==>', restaurants.length);
      console.log('Orders Data ==>', orders.length);
      console.log('Grocery Orders Data ==>', groceryOrders.length);

      // Calculate stats
      const totalRestaurants = restaurants.length;
      const totalFoodOrders = orders.length;
      const totalGroceryOrders = groceryOrders.length;
      const totalOrders = totalFoodOrders + totalGroceryOrders;
      const totalGroceryItems = groceryItems.length;

      // Calculate total sales
      const foodSales = orders.reduce((total, order) => total + (Number(order.totalAmount) || 0), 0);
      const grocerySales = groceryOrders.reduce((total, order) => total + (Number(order.totalAmount) || 0), 0);
      const totalSales = foodSales + grocerySales;

      // Prepare chart data
      const orderTypeData = [
        { name: 'Food', value: totalFoodOrders },
        { name: 'Grocery', value: totalGroceryOrders },
      ];

      // Mock sales trend data (in real app, you'd aggregate by date)
      const salesData = generateSalesTrendData();

      // Get recent orders (combined food and grocery)
      const allOrders = [
        ...orders.map(order => ({ ...order, type: 'food' })),
        ...groceryOrders.map(order => ({ ...order, type: 'grocery' }))
      ].sort((a, b) => {
        const dateA = getDateFromTimestamp(a.createdAt);
        const dateB = getDateFromTimestamp(b.createdAt);
        return dateB - dateA; // Sort descending (newest first)
      }).slice(0, 5);

      setStats({
        totalRestaurants,
        totalOrders,
        totalGroceryItems,
        totalSales,
      });
      setSalesData(salesData);
      setOrderTypeData(orderTypeData);
      setRecentOrders(allOrders);

    } catch (error) {
      toast.error('Error fetching dashboard data');
      console.error('Dashboard Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSalesTrendData = () => {
    // Mock data - in production, you would aggregate actual sales data by date
    return [
      { name: 'Jan', sales: 4000 },
      { name: 'Feb', sales: 3000 },
      { name: 'Mar', sales: 5000 },
      { name: 'Apr', sales: 2780 },
      { name: 'May', sales: 1890 },
      { name: 'Jun', sales: 2390 },
    ];
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: 1.5,
              color: 'white',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Restaurants"
            value={stats.totalRestaurants}
            icon={<RestaurantIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<OrderIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Grocery Items"
            value={stats.totalGroceryItems}
            icon={<GroceryIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sales"
            value={`₹${stats.totalSales.toFixed(2)}`}
            icon={<MoneyIcon />}
            color="#9c27b0"
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sales Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Orders']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <Box>
                {recentOrders.length === 0 ? (
                  <Typography color="textSecondary" align="center" py={3}>
                    No recent orders
                  </Typography>
                ) : (
                  recentOrders.map((order) => {
                    const orderDate = getDateFromTimestamp(order.createdAt);
                    return (
                      <Box
                        key={order.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1.5,
                          px: 2,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' }
                        }}
                      >
                        <Box>
                          <Typography fontWeight="medium">
                            Order #{order.id.slice(-6)} 
                            <Typography 
                              component="span" 
                              variant="body2" 
                              color="textSecondary"
                              sx={{ ml: 1 }}
                            >
                              ({order.type})
                            </Typography>
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {orderDate.toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography 
                            color={
                              order.status === 'delivered' ? 'success.main' :
                              order.status === 'pending' ? 'warning.main' :
                              order.status === 'cancelled' ? 'error.main' : 'info.main'
                            }
                            fontWeight="medium"
                          >
                            {order.status || 'pending'}
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            ${(Number(order.total) || 0).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;