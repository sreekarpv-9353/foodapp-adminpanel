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
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';

const GroceryOrders = () => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching grocery orders...');
      
      // Query to get grocery orders using both orderType and type fields
      const q = query(
        collection(db, 'orders'),
        where('orderType', '==', 'grocery')
      );
      
      const querySnapshot = await getDocs(q);
      
      console.log('Grocery orders found:', querySnapshot.size);
      
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
          customerName: data.customerName || data.deliveryAddress?.name,
          customerPhone: data.customerPhone || data.deliveryAddress?.phone,
          totalAmount: data.pricing?.grandTotal || data.totalAmount || 0,
          itemCount: data.itemCount || (data.items ? data.items.length : 0)
        };
      });

      console.log('Processed grocery orders:', ordersData);

      // Sort by updatedAt (most recent first)
      const sortedOrders = ordersData.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
        const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
        return dateB - dateA; // Descending order (newest first)
      });

      console.log('Sorted grocery orders:', sortedOrders);

      setAllOrders(sortedOrders);
      setOrders(sortedOrders);
      
      toast.success(`Loaded ${sortedOrders.length} grocery orders`);
      
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
      search: '',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'secondary',
      packing: 'secondary',
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
      field: 'paymentMethod', 
      headerName: 'Payment', 
      width: 120,
      renderCell: (params) => params.value || 'COD',
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
            color="success"
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
    'packing',
    'ready',
    'out-for-delivery',
    'delivered',
    'cancelled',
  ];

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.search) count++;
    return count;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <LocalGroceryStoreIcon sx={{ fontSize: '2rem', mr: 1 }} />
          Grocery Orders Management
        </Typography>
        <Chip 
          label={`${orders.length} Orders`} 
          color="success" 
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
            <Grid item xs={12} sm={6} md={4}>
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
            <Grid item xs={12} sm={6} md={5}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained"
                  color="success"
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
              <Typography sx={{ ml: 2 }}>Loading grocery orders...</Typography>
            </Box>
          ) : (
            <>
              {orders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="textSecondary" gutterBottom>
                    No grocery orders found
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
          <LocalGroceryStoreIcon color="success" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            Grocery Order Details
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
                        <Typography variant="body2" color="textSecondary">Payment Method</Typography>
                        <Typography variant="body1">
                          {selectedOrder.paymentMethod || 'COD'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Order Type</Typography>
                        <Chip 
                          label="Grocery" 
                          color="success" 
                          size="small"
                          variant="outlined"
                        />
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
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
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
                        {selectedOrder.itemCount || selectedOrder.items.length} grocery items
                      </Typography>
                    )}
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Delivery Address */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOnIcon color="success" sx={{ mr: 1 }} />
                Delivery Address
              </Typography>
              
              {selectedOrder.deliveryAddress ? (
                <Card variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'success.main', mr: 2, width: 32, height: 32 }}>
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
                        <Avatar sx={{ bgcolor: 'info.main', mr: 2, width: 32, height: 32 }}>
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

              {/* Grocery Items */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCartIcon color="success" sx={{ mr: 1 }} />
                Grocery Items
                {selectedOrder.items && (
                  <Chip 
                    label={`${selectedOrder.itemCount || selectedOrder.items.length} items`} 
                    size="small" 
                    sx={{ ml: 1 }}
                    color="success"
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
                                bgcolor: 'success.main', 
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
                                <Chip 
                                  label={item.category} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                              {item.brand && (
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                  Brand: {item.brand}
                                </Typography>
                              )}
                              {item.weight && (
                                <Typography variant="body2" color="textSecondary">
                                  Weight: {item.weight}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                              <Typography variant="body2" color="textSecondary">Unit Price</Typography>
                              <Typography variant="body1" fontWeight="medium">
                                ₹{(item.price || 0).toFixed(2)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                              <Typography variant="body2" color="textSecondary">Quantity</Typography>
                              <Chip 
                                label={`× ${item.quantity || 0}`}
                                color="success"
                                variant="outlined"
                                size="small"
                              />
                            </Box>
                            
                            <Box sx={{ textAlign: 'center', minWidth: 100 }}>
                              <Typography variant="body2" color="textSecondary">Subtotal</Typography>
                              <Typography variant="body1" fontWeight="bold" color="success.main">
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
                    No grocery items found in this order
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
            color="success"
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

export default GroceryOrders;