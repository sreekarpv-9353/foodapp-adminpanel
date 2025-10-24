import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  ShoppingCart as OrderIcon,
  LocalGroceryStore as GroceryIcon,
  CurrencyRupee as CurrencyRupee,
  Fastfood as FoodIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Helper function to safely convert Firestore timestamp to Date
  const getDateFromTimestamp = (timestamp) => {
    if (!timestamp) return new Date(0);
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    return new Date(0);
  };

  // Helper function to get total amount from order
  const getOrderTotal = (order) => {
    return Number(order.pricing?.grandTotal) || 
           Number(order.total) || 
           Number(order.amount) || 
           Number(order.pricing?.grandTotal) || 
           0;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [restaurantsSnapshot, ordersSnapshot, groceryItemsSnapshot] = await Promise.all([
        getDocs(collection(db, 'restaurants')),
        getDocs(query(collection(db, 'orders'), orderBy('updatedAt', 'desc'))),
        getDocs(collection(db, 'groceryItems'))
      ]);

      // Process restaurants
      const restaurants = restaurantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Process orders - all orders are in the same collection with orderType field
      const allOrders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Process grocery items
      const groceryItems = groceryItemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('All Orders:', allOrders);
      console.log('Orders with orderType:', allOrders.filter(order => order.orderType));

      // Separate orders by type
      const foodOrders = allOrders.filter(order => order.orderType === 'food');
      const groceryOrders = allOrders.filter(order => order.orderType === 'grocery');

      // Calculate stats
      const totalRestaurants = restaurants.length;
      const totalFoodOrders = foodOrders.length;
      const totalGroceryOrders = groceryOrders.length;
      const totalOrders = allOrders.length;
      const totalGroceryItems = groceryItems.length;

      // Calculate total sales
      const foodSales = foodOrders.reduce((total, order) => total + getOrderTotal(order), 0);
      const grocerySales = groceryOrders.reduce((total, order) => total + getOrderTotal(order), 0);
      const totalSales = foodSales + grocerySales;

      // Prepare chart data with better labels
      const orderTypeData = [
        { 
          name: 'Food', 
          value: totalFoodOrders,
          fullLabel: `Food: ${totalFoodOrders} (${totalOrders > 0 ? Math.round((totalFoodOrders / totalOrders) * 100) : 0}%)`
        },
        { 
          name: 'Grocery', 
          value: totalGroceryOrders,
          fullLabel: `Grocery: ${totalGroceryOrders} (${totalOrders > 0 ? Math.round((totalGroceryOrders / totalOrders) * 100) : 0}%)`
        },
      ];

      // Mock sales trend data
      const salesData = generateSalesTrendData();

      // Get recent orders (already sorted by updatedAt from the query)
      const recentOrders = allOrders
        .slice(0, 5) // Get only 5 most recent orders
        .map(order => ({
          ...order,
          displayType: order.orderType === 'food' ? 'Food Order' : 'Grocery Order',
          displayTotal: getOrderTotal(order),
          icon: order.orderType === 'food' ? <FoodIcon /> : <GroceryIcon />
        }));

      console.log('Recent Orders:', recentOrders);

      setStats({
        totalRestaurants,
        totalOrders,
        totalGroceryItems,
        totalSales,
        totalFoodOrders,
        totalGroceryOrders,
      });
      setSalesData(salesData);
      setOrderTypeData(orderTypeData);
      setRecentOrders(recentOrders);

    } catch (error) {
      toast.error('Error fetching dashboard data');
      console.error('Dashboard Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSalesTrendData = () => {
    return [
      { name: 'Jan', sales: 4000 },
      { name: 'Feb', sales: 3000 },
      { name: 'Mar', sales: 5000 },
      { name: 'Apr', sales: 2780 },
      { name: 'May', sales: 1890 },
      { name: 'Jun', sales: 2390 },
    ];
  };

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent === 0) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {}
      }}
      onClick={onClick}
    >
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

  // Helper function to get status color and display
  const getStatusInfo = (status) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending' },
      confirmed: { color: 'info', label: 'Confirmed' },
      preparing: { color: 'secondary', label: 'Preparing' },
      packing: { color: 'secondary', label: 'Packing' },
      'out-for-delivery': { color: 'primary', label: 'Out for Delivery' },
      delivered: { color: 'success', label: 'Delivered' },
      cancelled: { color: 'error', label: 'Cancelled' },
      completed: { color: 'success', label: 'Completed' },
    };
    
    return statusConfig[status] || { color: 'default', label: status || 'Pending' };
  };

  // Helper function to format order ID safely
  const formatOrderId = (orderId) => {
    if (!orderId) return 'N/A';
    return `#${orderId.slice(-8).toUpperCase()}`;
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.5,
            boxShadow: 2,
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {data.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Orders: {data.value}
          </Typography>
          <Typography variant="body2" color="primary.main">
            {data.value > 0 && stats.totalOrders > 0 
              ? `${Math.round((data.value / stats.totalOrders) * 100)}% of total`
              : '0% of total'
            }
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={handleSettingsClick}
          sx={{ borderRadius: 2 }}
        >
          App Settings
        </Button>
      </Box>
      
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
            icon={<CurrencyRupee />}
            color="#9c27b0"
          />
        </Grid>

        {/* Quick Settings Card */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <SettingsIcon sx={{ mr: 1 }} />
                    App Configuration
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Configure minimum order values, delivery fees, and other app settings
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<SettingsIcon />}
                  onClick={handleSettingsClick}
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'grey.100'
                    }
                  }}
                >
                  Manage Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Type Breakdown */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Types Breakdown
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {orderTypeData.map((item, index) => (
                  <Box key={item.name} display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <Typography variant="body1">
                        {item.name} Orders
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="body1" fontWeight="bold">
                        {item.value}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {stats.totalOrders > 0 ? Math.round((item.value / stats.totalOrders) * 100) : 0}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
                <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" fontWeight="bold">
                      Total Orders
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary.main">
                      {stats.totalOrders}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sales Breakdown
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Food Sales</Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary.main">
                    ₹{(stats.totalFoodOrders ? stats.totalSales * (stats.totalFoodOrders / stats.totalOrders) : 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Grocery Sales</Typography>
                  <Typography variant="body1" fontWeight="bold" color="secondary.main">
                    ₹{(stats.totalGroceryOrders ? stats.totalSales * (stats.totalGroceryOrders / stats.totalOrders) : 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" fontWeight="bold">Total Sales</Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      ₹{stats.totalSales.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
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
                  <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
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
              <Typography variant="h6" gutterBottom textAlign="center">
                Order Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={isMobile ? 70 : 100}
                    innerRadius={isMobile ? 40 : 50}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <Box display="flex" justifyContent="center" gap={2} mt={2} flexWrap="wrap">
                {orderTypeData.map((item, index) => (
                  <Box key={item.name} display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                    <Typography variant="body2">
                      {item.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Recent Orders (Last 5 - Sorted by Updated Date)
                </Typography>
                <Chip 
                  label={`Total: ${stats.totalOrders} orders`} 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
              <Box>
                {recentOrders.length === 0 ? (
                  <Typography color="textSecondary" align="center" py={3}>
                    No recent orders found
                  </Typography>
                ) : (
                  recentOrders.map((order) => {
                    const orderDate = getDateFromTimestamp(order.updatedAt || order.createdAt);
                    const statusInfo = getStatusInfo(order.status);
                    
                    return (
                      <Box
                        key={order.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 2,
                          px: 2,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' },
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                          borderRadius: 1,
                        }}
                      >
                        <Box display="flex" alignItems="center" flex={1}>
                          <Box 
                            sx={{ 
                              mr: 2,
                              color: order.orderType === 'food' ? 'primary.main' : 'secondary.main'
                            }}
                          >
                            {order.orderType === 'food' ? <FoodIcon /> : <GroceryIcon />}
                          </Box>
                          <Box flex={1}>
                            <Typography fontWeight="medium">
                              {formatOrderId(order.id)}
                              <Typography 
                                component="span" 
                                variant="body2" 
                                color="textSecondary"
                                sx={{ ml: 1 }}
                              >
                                ({order.displayType})
                              </Typography>
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Updated: {orderDate.toLocaleDateString('en-IN', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                            {order.customerName && (
                              <Typography variant="body2" color="textSecondary">
                                Customer: {order.customerName}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Box textAlign="right" sx={{ minWidth: 140 }}>
                          <Chip 
                            label={statusInfo.label} 
                            color={statusInfo.color}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="h6" fontWeight="bold" color="primary.main">
                            ₹{(order.pricing?.grandTotal || 0).toFixed(2)}
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