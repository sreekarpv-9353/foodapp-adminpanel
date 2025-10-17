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

const GroceryOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Query the unified 'orders' collection and filter by orderType = 'grocery'
      let q = query(
        collection(db, 'orders'), 
        where('orderType', '==', 'grocery')
        // orderBy('createdAt', 'desc')
      );
      
      // Apply additional status filter if set
      if (filters.status) {
        q = query(
          collection(db, 'orders'),
          where('orderType', '==', 'grocery'),
          where('status', '==', filters.status),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      console.log('Fetched grocery orders:', ordersData);
      setOrders(ordersData);
    } catch (error) {
      toast.error('Error fetching grocery orders');
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
        updatedAt: new Date().toISOString(),
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
      width: 120,
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
    'packing',
    'ready',
    'out-for-delivery',
    'delivered',
    'cancelled',
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '2rem', marginRight: '12px' }}>🛒</span>
          Grocery Orders Management
        </Typography>
        <Chip 
          label={`${orders.length} Orders`} 
          color="success" 
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
            sx={{
              '& .MuiDataGrid-cell': {
                fontSize: '0.875rem',
              },
            }}
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
          <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>🛒</span>
          Grocery Order Details
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
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
                <Typography variant="subtitle2" color="textSecondary">Total Amount</Typography>
                <Typography variant="h6" color="success.main">
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
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Delivery Address
                </Typography>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  {selectedOrder.deliveryAddress ? (
                    <>
                      {selectedOrder.deliveryAddress.name && (
                        <Typography fontWeight="bold">{selectedOrder.deliveryAddress.name}</Typography>
                      )}
                      <Typography>{selectedOrder.deliveryAddress.street}</Typography>
                      <Typography>
                        {selectedOrder.deliveryAddress.city}
                        {selectedOrder.deliveryAddress.state && `, ${selectedOrder.deliveryAddress.state}`}
                        {selectedOrder.deliveryAddress.zipCode && ` - ${selectedOrder.deliveryAddress.zipCode}`}
                      </Typography>
                      {selectedOrder.deliveryAddress.phone && (
                        <Typography color="textSecondary">
                          Phone: {selectedOrder.deliveryAddress.phone}
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography color="textSecondary">No delivery address provided</Typography>
                  )}
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                  📦 Order Items ({selectedOrder.items?.length || 0})
                </Typography>
                {selectedOrder.items?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {selectedOrder.items.map((item, index) => (
                      <Card key={index} variant="outlined" sx={{ p: 2, bgcolor: 'background.paper', '&:hover': { boxShadow: 2 } }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={1}>
                            <Typography variant="h6" color="textSecondary">
                              {index + 1}.
                            </Typography>
                          </Grid>
                          <Grid item xs={11} sm={5}>
                            <Box>
                              <Typography variant="body1" fontWeight="bold" sx={{ mb: 0.5 }}>
                                {item.name || 'Unknown Item'}
                              </Typography>
                              {item.category && (
                                <Chip 
                                  label={item.category} 
                                  size="small" 
                                  color="success"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          </Grid>
                          <Grid item xs={4} sm={2} textAlign="center">
                            <Typography variant="caption" color="textSecondary" display="block">
                              Unit Price
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              ₹{(item.price || 0).toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={4} sm={2} textAlign="center">
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
                          <Grid item xs={4} sm={2} textAlign="right">
                            <Typography variant="caption" color="textSecondary" display="block">
                              Subtotal
                            </Typography>
                            <Typography variant="body1" fontWeight="bold" color="success.main">
                              ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Card>
                    ))}
                    
                    {/* Order Summary */}
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'primary.50', mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Items Total:</Typography>
                        <Typography fontWeight="bold">
                          ₹{selectedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                        </Typography>
                      </Box>
                      {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Delivery Fee:</Typography>
                        <Typography fontWeight="bold">₹20.00</Typography>
                      </Box> */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 2, borderColor: 'divider' }}>
                        <Typography variant="h6">Grand Total:</Typography>
                        <Typography variant="h6" color="success.main" fontWeight="bold">
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

export default GroceryOrders;