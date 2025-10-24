import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

const FoodOrders = () => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    restaurant: '',
    search: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'restaurants'));
      const restaurantsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRestaurants(restaurantsData);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching food orders...');
      
      // Query to get only food orders
      const q = query(
        collection(db, 'orders'),
        where('orderType', '==', 'food')
      );
      
      const querySnapshot = await getDocs(q);
      
      console.log('Food orders found:', querySnapshot.size);
      
      const ordersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert Firestore timestamps to JavaScript Date objects
        const convertTimestamp = (timestamp) => {
          if (!timestamp) return null;
          if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
          }
          if (typeof timestamp === 'string') {
            return new Date(timestamp);
          }
          return timestamp;
        };

        return {
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt) || convertTimestamp(data.createdAt),
          // Map the new data structure
          restaurantId: data.restaurant?.restaurantId || data.restaurantId,
          customerName: data.customerName || data.deliveryAddress?.name,
          customerPhone: data.customerPhone || data.deliveryAddress?.phone,
          totalAmount: data.pricing?.grandTotal || data.totalAmount || 0,
          itemCount: data.itemCount || (data.items ? data.items.length : 0)
        };
      });

      console.log('Processed food orders:', ordersData);

      // Sort by updatedAt (most recent first)
      const sortedOrders = ordersData.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
        const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
        return dateB - dateA; // Descending order (newest first)
      });

      console.log('Sorted food orders:', sortedOrders);

      setAllOrders(sortedOrders);
      setOrders(sortedOrders);
      
      toast.success(`Loaded ${sortedOrders.length} food orders`);
      
    } catch (error) {
      const errorMsg = 'Error fetching orders: ' + error.message;
      console.error('Fetch Error:', error);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to all orders
  const applyFilters = (ordersToFilter, currentFilters) => {
    let filteredOrders = [...ordersToFilter];

    // Filter by status
    if (currentFilters.status) {
      filteredOrders = filteredOrders.filter(order => 
        order.status === currentFilters.status
      );
    }

    // Filter by restaurant
    if (currentFilters.restaurant) {
      filteredOrders = filteredOrders.filter(order => 
        order.restaurantId === currentFilters.restaurant
      );
    }

    // Filter by search
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order => {
        const orderId = order.id?.toLowerCase() || '';
        const customerName = order.customerName?.toLowerCase() || '';
        const customerPhone = order.customerPhone?.toLowerCase() || '';
        
        return orderId.includes(searchLower) ||
               customerName.includes(searchLower) ||
               customerPhone.includes(searchLower);
      });
    }

    setOrders(filteredOrders);
  };

  useEffect(() => {
    if (allOrders.length > 0) {
      applyFilters(allOrders, filters);
    }
  }, [filters, allOrders]);

  const handleFilterChange = (filter, value) => {
    setFilters(prev => ({
      ...prev,
      [filter]: value,
    }));
  };

  const handleSearchChange = (event) => {
    setFilters(prev => ({
      ...prev,
      search: event.target.value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      restaurant: '',
      search: '',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'secondary',
      ready: 'info',
      'out-for-delivery': 'primary',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedOrder) return;

    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: newStatus,
        updatedAt: new Date(),
      });
      
      toast.success(`Order status updated to ${newStatus}`);
      setStatusDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders(); // Refresh to get updated data
    } catch (error) {
      toast.error('Error updating order status: ' + error.message);
      console.error('Update Error:', error);
    }
  };

  const columns = [
    { 
      field: 'id', 
      headerName: 'Order ID', 
      width: 120,
      renderCell: (params) => {
        const orderId = params.value || '';
        return `#${orderId.slice(-6)}`;
      },
    },
    { 
      field: 'restaurant', 
      headerName: 'Restaurant', 
      width: 200,
      renderCell: (params) => {
        return params.row.restaurant?.name || 'Unknown Restaurant';
      },
    },
    { 
      field: 'customerName', 
      headerName: 'Customer', 
      width: 150,
      renderCell: (params) => {
        return params.value || 'Unknown Customer';
      },
    },
    { 
      field: 'customerPhone', 
      headerName: 'Phone', 
      width: 130,
    },
    { 
      field: 'itemCount', 
      headerName: 'Items', 
      width: 80,
      renderCell: (params) => {
        return params.value || 0;
      },
    },
    { 
      field: 'totalAmount', 
      headerName: 'Total', 
      width: 100,
      renderCell: (params) => `₹${(params.value || 0).toFixed(2)}`,
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'pending'} 
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    { 
      field: 'updatedAt', 
      headerName: 'Last Updated', 
      width: 180,
      renderCell: (params) => {
        if (!params.value) return '-';
        try {
          const date = params.value instanceof Date ? params.value : new Date(params.value);
          return dayjs(date).format('MMM D, YYYY h:mm A');
        } catch (error) {
          return '-';
        }
      },
    },
    { 
      field: 'createdAt', 
      headerName: 'Order Date', 
      width: 180,
      renderCell: (params) => {
        if (!params.value) return '-';
        try {
          const date = params.value instanceof Date ? params.value : new Date(params.value);
          return dayjs(date).format('MMM D, YYYY h:mm A');
        } catch (error) {
          return '-';
        }
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedOrder(params.row);
              setDetailDialogOpen(true);
            }}
          >
            View Details
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => {
              setSelectedOrder(params.row);
              setStatusDialogOpen(true);
            }}
          >
            Update Status
          </Button>
        </Box>
      ),
    },
  ];

  const statusOptions = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out-for-delivery',
    'delivered',
    'cancelled',
  ];

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.restaurant) count++;
    if (filters.search) count++;
    return count;
  };

  // Calculate items total from items array (fallback)
  const calculateItemsTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((total, item) => {
      const quantity = item.quantity || 0;
      const price = item.price || 0;
      return total + (quantity * price);
    }, 0);
  };

  // Calculate total items count
  const calculateTotalItems = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '2rem', marginRight: '12px' }}>🍽️</span>
          Food Orders Management
        </Typography>
        <Chip 
          label={`${orders.length} Orders`} 
          color="primary" 
          sx={{ ml: 2 }}
        />
        {getActiveFiltersCount() > 0 && (
          <Chip 
            label={`${getActiveFiltersCount()} filter(s) active`} 
            color="warning" 
            sx={{ ml: 1 }}
            onDelete={clearFilters}
          />
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button 
            size="small" 
            onClick={fetchOrders}
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {statusOptions.map(status => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Restaurant</InputLabel>
                <Select
                  value={filters.restaurant}
                  label="Restaurant"
                  onChange={(e) => handleFilterChange('restaurant', e.target.value)}
                >
                  <MenuItem value="">All Restaurants</MenuItem>
                  {restaurants.map(restaurant => (
                    <MenuItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search Orders"
                value={filters.search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="Order ID, Customer Name, Phone..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                  onClick={fetchOrders}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  onClick={clearFilters}
                  disabled={getActiveFiltersCount() === 0}
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders DataGrid */}
      <Card>
        <CardContent>
          {loading && allOrders.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading food orders...</Typography>
            </Box>
          ) : (
            <>
              {orders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="textSecondary" gutterBottom>
                    No food orders found
                  </Typography>
                  <Button variant="outlined" onClick={fetchOrders}>
                    Refresh
                  </Button>
                </Box>
              ) : (
                <DataGrid
                  rows={orders}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  autoHeight
                  disableSelectionOnClick
                  getRowId={(row) => row.id}
                  loading={loading}
                  initialState={{
                    sorting: {
                      sortModel: [{ field: 'updatedAt', sort: 'desc' }],
                    },
                  }}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, pt: 2 }}>
            <Typography gutterBottom>
              Order ID: <strong>#{selectedOrder?.id?.slice(-6) || selectedOrder?.id}</strong>
            </Typography>
            <Typography gutterBottom>
              Customer: <strong>{selectedOrder?.customerName || 'Unknown'}</strong>
            </Typography>
            <Typography gutterBottom sx={{ mb: 3 }}>
              Current Status: <Chip 
                label={selectedOrder?.status || 'pending'} 
                color={getStatusColor(selectedOrder?.status)}
                size="small"
              />
            </Typography>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                label="New Status"
                defaultValue=""
              >
                {statusOptions.map(status => (
                  <MenuItem 
                    key={status} 
                    value={status}
                    onClick={() => handleStatusUpdate(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{ '& .MuiDialog-paper': { maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <RestaurantIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            Food Order Details
          </Typography>
          <Chip 
            label={selectedOrder?.status || 'pending'} 
            color={getStatusColor(selectedOrder?.status)}
            sx={{ ml: 2 }}
          />
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedOrder && (
            <Box>
              {/* Order Header */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      📋 Order Information
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Order ID</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          #{selectedOrder.id?.slice(-8)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Customer</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {selectedOrder.customerName || 'Unknown'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Restaurant</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedOrder.restaurant?.name || 'Unknown Restaurant'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Payment Method</Typography>
                        <Typography variant="body1">
                          {selectedOrder.paymentMethod || 'COD'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Order Date</Typography>
                        <Typography variant="body1">
                          {selectedOrder.createdAt ? 
                            dayjs(selectedOrder.createdAt).format('MMM D, YYYY h:mm A') : 
                            'N/A'
                          }
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Last Updated</Typography>
                        <Typography variant="body1">
                          {selectedOrder.updatedAt ? 
                            dayjs(selectedOrder.updatedAt).format('MMM D, YYYY h:mm A') : 
                            'N/A'
                          }
                        </Typography>
                      </Grid>
                      {selectedOrder.deliveryTime && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Delivery Time</Typography>
                          <Typography variant="body1">
                            {selectedOrder.deliveryTime} minutes
                          </Typography>
                        </Grid>
                      )}
                      {selectedOrder.deliveryZone && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Delivery Zone</Typography>
                          <Typography variant="body1">
                            {selectedOrder.deliveryZone}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      💰 Payment Summary
                    </Typography>
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h4" fontWeight="bold">
                        ₹{(selectedOrder.totalAmount || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2">
                        Total Amount
                      </Typography>
                    </Box>
                    {selectedOrder.items && (
                      <Typography variant="body2" sx={{ textAlign: 'center', mt: 1 }}>
                        {selectedOrder.itemCount || selectedOrder.items.length} items
                      </Typography>
                    )}
                    {selectedOrder.restaurant?.rating && (
                      <Typography variant="body2" sx={{ textAlign: 'center', mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ⭐ {selectedOrder.restaurant.rating}
                      </Typography>
                    )}
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Delivery Address */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                Delivery Address
              </Typography>
              
              {selectedOrder.deliveryAddress ? (
                <Card variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="textSecondary">Customer Name</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {selectedOrder.deliveryAddress.name || selectedOrder.customerName || 'Not Provided'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', mr: 2, width: 32, height: 32 }}>
                          <PhoneIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="textSecondary">Phone Number</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {selectedOrder.deliveryAddress.phone || selectedOrder.customerPhone || 'Not Provided'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        <LocationOnIcon color="action" sx={{ mr: 2, mt: 0.5 }} />
                        <Box>
                          <Typography variant="body2" color="textSecondary">Delivery Address</Typography>
                          <Typography variant="body1">
                            {selectedOrder.deliveryAddress.street || 'Street not provided'}
                          </Typography>
                          <Typography variant="body1">
                            {selectedOrder.deliveryAddress.villageTown || selectedOrder.deliveryAddress.city || ''}
                            {selectedOrder.deliveryAddress.state && `, ${selectedOrder.deliveryAddress.state}`}
                            {selectedOrder.deliveryAddress.zipCode && ` - ${selectedOrder.deliveryAddress.zipCode}`}
                          </Typography>
                          {selectedOrder.deliveryAddress.landmark && (
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                              Landmark: {selectedOrder.deliveryAddress.landmark}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              ) : (
                <Card variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'warning.light' }}>
                  <Typography color="textSecondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                    ⚠️ No delivery address provided for this order
                  </Typography>
                </Card>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Order Items */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingBagIcon color="primary" sx={{ mr: 1 }} />
                Order Items
                {selectedOrder.items && (
                  <Chip 
                    label={`${selectedOrder.itemCount || selectedOrder.items.length} items`} 
                    size="small" 
                    sx={{ ml: 1 }}
                    color="primary"
                  />
                )}
              </Typography>

              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                <Box>
                  {/* Items List */}
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    {selectedOrder.items.map((item, index) => (
                      <Box key={index}>
                        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: 'primary.main', 
                                mr: 2, 
                                width: 40, 
                                height: 40,
                                fontSize: '0.875rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {index + 1}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" fontWeight="bold">
                                {item.name || 'Unknown Item'}
                              </Typography>
                              {item.category && (
                                <Typography variant="body2" color="textSecondary">
                                  {item.category}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                              <Typography variant="body2" color="textSecondary">Price</Typography>
                              <Typography variant="body1" fontWeight="medium">
                                ₹{(item.price || 0).toFixed(2)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                              <Typography variant="body2" color="textSecondary">Quantity</Typography>
                              <Chip 
                                label={`× ${item.quantity || 0}`}
                                color="primary"
                                variant="outlined"
                                size="small"
                              />
                            </Box>
                            
                            <Box sx={{ textAlign: 'center', minWidth: 100 }}>
                              <Typography variant="body2" color="textSecondary">Subtotal</Typography>
                              <Typography variant="body1" fontWeight="bold" color="primary.main">
                                ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        {index < selectedOrder.items.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </Card>

                  {/* Order Summary */}
                  <Card variant="outlined" sx={{ p: 3, bgcolor: 'success.light', color: 'white' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      📊 Order Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Items Total:</Typography>
                          <Typography fontWeight="bold">
                            ₹{(selectedOrder.pricing?.itemsTotal || calculateItemsTotal(selectedOrder.items)).toFixed(2)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Delivery Fee:</Typography>
                          <Typography fontWeight="bold">
                            ₹{(selectedOrder.pricing?.deliveryFee || 0).toFixed(2)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Tax ({selectedOrder.pricing?.taxPercentage || 5}%):</Typography>
                          <Typography fontWeight="bold">
                            ₹{(selectedOrder.pricing?.taxAmount || 0).toFixed(2)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: 2, borderColor: 'divider' }}>
                          <Typography variant="h6">Grand Total:</Typography>
                          <Typography variant="h6" fontWeight="bold">
                            ₹{(selectedOrder.pricing?.grandTotal || selectedOrder.totalAmount || 0).toFixed(2)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Box>
              ) : (
                <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    No items found in this order
                  </Typography>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          <Button 
            variant="contained"
            onClick={() => {
              setDetailDialogOpen(false);
              setStatusDialogOpen(true);
            }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodOrders;