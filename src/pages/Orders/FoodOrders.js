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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { collection, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const FoodOrders = () => {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    restaurant: '',
  });

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
      let q = query(
        collection(db, 'orders'), 
        where('orderType', '==', 'food')
      );

      if (filters.status) {
        q = query(
          collection(db, 'orders'),
          where('orderType', '==', 'food'),
          where('status', '==', filters.status),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(ordersData);
    } catch (error) {
      toast.error('Error fetching orders');
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'secondary',
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
      fetchOrders();
    } catch (error) {
      toast.error('Error updating order status');
      console.error('Error:', error);
    }
  };

  const handleFilterChange = (filter, value) => {
    setFilters(prev => ({
      ...prev,
      [filter]: value,
    }));
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
      field: 'restaurantId', 
      headerName: 'Restaurant', 
      width: 200,
      renderCell: (params) => {
        const restaurant = restaurants.find(r => r.id === params.value);
        return restaurant?.name || 'Unknown Restaurant';
      },
    },
    { 
      field: 'userId', 
      headerName: 'Customer', 
      width: 150,
      renderCell: (params) => {
        const userId = params.value || '';
        return `Customer ${userId.slice(-6)}`;
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
      field: 'createdAt', 
      headerName: 'Order Date', 
      width: 180,
      renderCell: (params) => {
        if (!params.value) return '-';
        try {
          const date = params.value.toDate ? params.value.toDate() : new Date(params.value);
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
            View
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
    'out-for-delivery',
    'delivered',
    'cancelled',
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '2rem', marginRight: '12px' }}>🍽️</span>
          Food Orders Management
        </Typography>
        <Chip 
          label={`${orders.length} Orders`} 
          color="warning" 
          sx={{ ml: 2 }}
        />
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
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
              <Button 
                variant="outlined" 
                onClick={fetchOrders}
                fullWidth
              >
                Refresh Orders
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DataGrid
            rows={orders}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            autoHeight
            disableSelectionOnClick
            getRowId={(row) => row.id}
          />
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>🍽️</span>
          Food Order Details
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Order ID</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    #{selectedOrder.id?.slice(-6) || selectedOrder.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip 
                      label={selectedOrder.status || 'pending'} 
                      color={getStatusColor(selectedOrder.status)}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Restaurant</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {restaurants.find(r => r.id === selectedOrder.restaurantId)?.name || 'Unknown Restaurant'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Total Amount</Typography>
                  <Typography variant="h6" color="primary.main">
                    ₹{(selectedOrder.totalAmount || 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Payment Method</Typography>
                  <Typography variant="body1">{selectedOrder.paymentMethod || 'COD'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Order Date</Typography>
                  <Typography variant="body1">
                    {selectedOrder.createdAt ? 
                      (selectedOrder.createdAt.toDate ? 
                        dayjs(selectedOrder.createdAt.toDate()).format('MMM D, YYYY h:mm A') : 
                        dayjs(selectedOrder.createdAt).format('MMM D, YYYY h:mm A')
                      ) : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Customer ID</Typography>
                  <Typography variant="body1">
                    {selectedOrder.userId?.slice(-8) || 'N/A'}
                  </Typography>
                </Grid>

                {/* Delivery Address Section */}
                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>📍</span>
                      Delivery Address
                    </Typography>
                    <Card variant="outlined" sx={{ p: 2.5, bgcolor: 'warning.lighter' }}>
                      {selectedOrder.deliveryAddress ? (
                        <Box>
                          {selectedOrder.deliveryAddress.name && (
                            <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                              👤 {selectedOrder.deliveryAddress.name}
                            </Typography>
                          )}
                          <Typography variant="body1" sx={{ mb: 0.5 }}>
                            🏠 {selectedOrder.deliveryAddress.street}
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 0.5 }}>
                            📮 {selectedOrder.deliveryAddress.city}
                            {selectedOrder.deliveryAddress.state && `, ${selectedOrder.deliveryAddress.state}`}
                            {selectedOrder.deliveryAddress.zipCode && ` - ${selectedOrder.deliveryAddress.zipCode}`}
                          </Typography>
                          {selectedOrder.deliveryAddress.phone && (
                            <Typography variant="body1" color="primary.main" fontWeight="medium" sx={{ mt: 1 }}>
                              📞 {selectedOrder.deliveryAddress.phone}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                          ⚠️ No delivery address provided
                        </Typography>
                      )}
                    </Card>
                  </Box>
                </Grid>

                {/* Order Items Section */}
                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>🍕</span>
                      Order Items
                      <Chip 
                        label={`${selectedOrder.items?.length || 0} items`} 
                        size="small" 
                        sx={{ ml: 1 }}
                        color="primary"
                      />
                    </Typography>
                  </Box>
                  {selectedOrder.items?.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {selectedOrder.items.map((item, index) => (
                        <Card 
                          key={index} 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            bgcolor: 'background.paper',
                            '&:hover': { boxShadow: 2 }
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={1}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                }}
                              >
                                {index + 1}
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={5}>
                              <Typography variant="body1" fontWeight="bold">
                                {item.name || 'Unknown Item'}
                              </Typography>
                            </Grid>
                            <Grid item xs={4} sm={2}>
                              <Typography variant="caption" color="textSecondary" display="block">
                                Price
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                ₹{(item.price || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                            <Grid item xs={4} sm={2}>
                              <Typography variant="caption" color="textSecondary" display="block">
                                Quantity
                              </Typography>
                              <Chip 
                                label={`× ${item.quantity || 0}`}
                                color="primary"
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            </Grid>
                            <Grid item xs={4} sm={2}>
                              <Typography variant="caption" color="textSecondary" display="block">
                                Subtotal
                              </Typography>
                              <Typography variant="body1" fontWeight="bold" color="primary.main">
                                ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Card>
                      ))}
                      
                      {/* Order Summary */}
                      <Card variant="outlined" sx={{ p: 3, bgcolor: 'primary.lighter', mt: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          💰 Order Summary
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Items Total:</Typography>
                          <Typography fontWeight="bold">
                            ₹{selectedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                          </Typography>
                        </Box>
                        {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Delivery Fee:</Typography>
                          <Typography fontWeight="bold">₹30.00</Typography>
                        </Box> */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: 2, borderColor: 'divider' }}>
                          <Typography variant="h6">Grand Total:</Typography>
                          <Typography variant="h6" color="primary.main" fontWeight="bold">
                            ₹{(selectedOrder.totalAmount || 0).toFixed(2)}
                          </Typography>
                        </Box>
                      </Card>
                    </Box>
                  ) : (
                    <Typography color="textSecondary">No items in this order</Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
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