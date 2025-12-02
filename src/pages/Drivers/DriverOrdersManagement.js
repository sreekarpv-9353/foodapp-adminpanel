// src/pages/Drivers/DriverOrdersManagement.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';

const DriverOrdersManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [selectedDriverId, setSelectedDriverId] = useState(null); // null = no filter, 'unassigned' = show only unassigned in assigned grid
  const [search, setSearch] = useState('');

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [orderBeingAssigned, setOrderBeingAssigned] = useState(null);
  const [selectedDriverForAssign, setSelectedDriverForAssign] = useState('');

  // === Fetch Drivers ===
  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const q = query(collection(db, 'users'), where('role', '==', 'driver'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
      setDrivers(list);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      toast.error('Failed to load drivers');
    } finally {
      setLoadingDrivers(false);
    }
  };

  // === Fetch Orders ===
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const snap = await getDocs(collection(db, 'orders'));
      const list = snap.docs.map(d => {
        const data = d.data();

        const normalizeDate = (value) => {
          if (!value) return null;
          if (value.toDate && typeof value.toDate === 'function') return value.toDate();
          if (value instanceof Date) return value;
          if (typeof value === 'string' || typeof value === 'number') return new Date(value);
          return null;
        };

        return {
          id: d.id,
          ...data,
          createdAt: normalizeDate(data.createdAt),
          updatedAt: normalizeDate(data.updatedAt) || normalizeDate(data.createdAt),
          orderType: data.orderType || data.type || 'food',
        };
      });
      setOrders(list);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchOrders();
  }, []);

  // === Derived Data ===

  // Only non-delivered / non-completed orders
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status !== 'delivered' && o.status !== 'completed'
      ),
    [orders]
  );

  // Simple search on id, customer name, phone
  const searchedActiveOrders = useMemo(() => {
    if (!search.trim()) return activeOrders;
    const s = search.toLowerCase();
    return activeOrders.filter((o) => {
      const id = o.id?.toLowerCase() || '';
      const name = o.customerName?.toLowerCase() || o.deliveryAddress?.name?.toLowerCase() || '';
      const phone = o.customerPhone?.toLowerCase() || o.deliveryAddress?.phone?.toLowerCase() || '';
      return id.includes(s) || name.includes(s) || phone.includes(s);
    });
  }, [activeOrders, search]);

  const unassignedActiveOrders = useMemo(
    () => searchedActiveOrders.filter((o) => !o.driverId),
    [searchedActiveOrders]
  );

  const assignedActiveOrders = useMemo(() => {
    const assigned = searchedActiveOrders.filter((o) => !!o.driverId);
    if (!selectedDriverId || selectedDriverId === 'unassigned') {
      // show all assigned orders if no specific driver selected
      return assigned;
    }
    return assigned.filter((o) => o.driverId === selectedDriverId);
  }, [searchedActiveOrders, selectedDriverId]);

  // Count per driver, unassigned
  const driverActiveCounts = useMemo(() => {
    const map = {};
    activeOrders.forEach((o) => {
      if (o.driverId) {
        map[o.driverId] = (map[o.driverId] || 0) + 1;
      }
    });
    return map;
  }, [activeOrders]);

  const unassignedCount = unassignedActiveOrders.length;

  const getOrderTypeChip = (orderType) => {
    const type = orderType || 'food';
    if (type === 'grocery') {
      return (
        <Chip
          size="small"
          label="Grocery"
          color="success"
          variant="outlined"
        />
      );
    }
    return (
      <Chip
        size="small"
        label="Food"
        color="primary"
        variant="outlined"
      />
    );
  };

  const getStatusChip = (status) => {
    const normalized = status || 'pending';
    const colorMap = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'secondary',
      ready: 'info',
      'out-for-delivery': 'primary',
      delivered: 'success',
      completed: 'success',
      cancelled: 'error',
    };
    return (
      <Chip
        size="small"
        label={normalized.replace(/-/g, ' ')}
        color={colorMap[normalized] || 'default'}
      />
    );
  };

  const getAssignmentChip = (order) => {
    if (order.driverId) {
      return (
        <Chip
          size="small"
          label="Assigned"
          color="success"
          variant="filled"
        />
      );
    }
    return (
      <Chip
        size="small"
        label="Unassigned"
        color="warning"
        variant="outlined"
      />
    );
  };

  // === Assign / Reassign ===
  const openAssignDialog = (order) => {
    setOrderBeingAssigned(order);
    setSelectedDriverForAssign(order.driverId || '');
    setAssignDialogOpen(true);
  };

  const closeAssignDialog = () => {
    setAssignDialogOpen(false);
    setOrderBeingAssigned(null);
    setSelectedDriverForAssign('');
  };

  const handleAssignDriver = async () => {
    if (!orderBeingAssigned) return;
    if (!selectedDriverForAssign) {
      toast.error('Please select a driver');
      return;
    }

    try {
      const driver = drivers.find((d) => d.id === selectedDriverForAssign);
      if (!driver) {
        toast.error('Selected driver not found');
        return;
      }

      const orderRef = doc(db, 'orders', orderBeingAssigned.id);
      await updateDoc(orderRef, {
        driverId: driver.id,
        driverName: driver.name || driver.fullName || '',
        driverPhone: driver.phone || '',
        updatedAt: new Date().toISOString(),
      });

      toast.success('Order assigned / reassigned successfully');

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderBeingAssigned.id
            ? {
                ...o,
                driverId: driver.id,
                driverName: driver.name || driver.fullName || '',
                driverPhone: driver.phone || '',
              }
            : o
        )
      );

      closeAssignDialog();
    } catch (err) {
      console.error('Error assigning driver:', err);
      toast.error('Failed to assign driver');
    }
  };

  // === Columns ===

  const commonOrderColumns = [
    {
      field: 'id',
      headerName: 'Order ID',
      width: 120,
      valueGetter: (params) => `#${(params.row.id || '').slice(-6)}`,
    },
    {
      field: 'orderType',
      headerName: 'Type',
      width: 110,
      renderCell: (params) => getOrderTypeChip(params.value),
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      width: 160,
      valueGetter: (params) =>
        params.row.customerName ||
        params.row.deliveryAddress?.name ||
        'Unknown',
    },
    {
      field: 'customerPhone',
      headerName: 'Phone',
      width: 140,
      valueGetter: (params) =>
        params.row.customerPhone ||
        params.row.deliveryAddress?.phone ||
        '',
    },
    {
      field: 'status',
      headerName: 'Order Status',
      width: 150,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'assignment',
      headerName: 'Assignment',
      width: 140,
      renderCell: (params) => getAssignmentChip(params.row),
    },
    {
      field: 'totalAmount',
      headerName: 'Total',
      width: 110,
      valueGetter: (params) =>
        params.row.pricing?.grandTotal || params.row.totalAmount || 0,
      renderCell: (params) =>
        `₹${(params.row.pricing?.grandTotal || params.row.totalAmount || 0).toFixed(2)}`,
    },
  ];

  const unassignedColumns = [
    ...commonOrderColumns,
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="contained"
          startIcon={<LocalShippingIcon />}
          onClick={() => openAssignDialog(params.row)}
        >
          Assign
        </Button>
      ),
    },
  ];

  const assignedColumns = [
    ...commonOrderColumns,
    {
      field: 'driver',
      headerName: 'Driver',
      width: 200,
      valueGetter: (params) =>
        params.row.driverName ||
        drivers.find((d) => d.id === params.row.driverId)?.name ||
        'Unknown',
    },
    {
      field: 'driverPhone',
      headerName: 'Driver Phone',
      width: 150,
      valueGetter: (params) =>
        params.row.driverPhone ||
        drivers.find((d) => d.id === params.row.driverId)?.phone ||
        '',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<SwapHorizIcon />}
          onClick={() => openAssignDialog(params.row)}
        >
          Reassign
        </Button>
      ),
    },
  ];

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Driver Orders Management
        </Typography>

        <Box display="flex" gap={2} alignItems="center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              bgcolor: 'grey.100',
            }}
          >
            <LocalShippingIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2">
              Active Orders: <b>{activeOrders.length}</b>
            </Typography>
          </Box>

          <TextField
            size="small"
            placeholder="Search by ID, name, phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT: Drivers List */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                  <PersonIcon />
                </Avatar>
                <Typography variant="h6">Drivers</Typography>
              </Box>

              <Typography variant="body2" color="textSecondary" mb={1}>
                Select a driver to filter **assigned** orders.  
                Unassigned orders are always shown separately.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box mb={1}>
                <Button
                  fullWidth
                  size="small"
                  variant={!selectedDriverId ? 'contained' : 'outlined'}
                  color="primary"
                  onClick={() => setSelectedDriverId(null)}
                  sx={{ mb: 1, justifyContent: 'space-between' }}
                >
                  <span>All Assigned Orders</span>
                  <Chip
                    label={assignedActiveOrders.length}
                    size="small"
                    color="default"
                  />
                </Button>

                <Button
                  fullWidth
                  size="small"
                  variant={selectedDriverId === 'unassigned' ? 'contained' : 'outlined'}
                  color="warning"
                  onClick={() => setSelectedDriverId('unassigned')}
                  sx={{ justifyContent: 'space-between' }}
                >
                  <span>Unassigned Only (right)</span>
                  <Chip
                    label={unassignedCount}
                    size="small"
                    color="default"
                  />
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Drivers ({drivers.length})
              </Typography>

              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {loadingDrivers && (
                  <Typography variant="body2" color="textSecondary">
                    Loading drivers...
                  </Typography>
                )}
                {!loadingDrivers &&
                  drivers.map((driver) => {
                    const count = driverActiveCounts[driver.id] || 0;
                    const selected = selectedDriverId === driver.id;

                    return (
                      <Box
                        key={driver.id}
                        sx={{
                          p: 1,
                          mb: 1,
                          borderRadius: 2,
                          border: 1,
                          borderColor: selected ? 'primary.main' : 'divider',
                          bgcolor: selected ? 'primary.light' : 'background.paper',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: selected ? 'primary.light' : 'grey.100' },
                        }}
                        onClick={() => setSelectedDriverId(driver.id)}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {driver.name || driver.fullName || 'Unnamed'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {driver.phone || driver.email}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${count} active`}
                            size="small"
                            color={count > 0 ? 'primary' : 'default'}
                          />
                        </Box>
                      </Box>
                    );
                  })}

                {!loadingDrivers && drivers.length === 0 && (
                  <Typography variant="body2" color="textSecondary">
                    No drivers found. Add drivers from your Dashboard.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT: Orders */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={3}>
            {/* Unassigned Orders */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Unassigned Active Orders
                    </Typography>
                    <Chip
                      label={`${unassignedCount} order(s)`}
                      color={unassignedCount > 0 ? 'warning' : 'default'}
                    />
                  </Box>

                  <DataGrid
                    autoHeight
                    rows={unassignedActiveOrders}
                    columns={unassignedColumns}
                    getRowId={(row) => row.id}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 25]}
                    loading={loadingOrders}
                    disableSelectionOnClick
                    density="compact"
                    components={{
                      NoRowsOverlay: () => (
                        <Box p={2}>
                          <Typography variant="body2" color="textSecondary">
                            No unassigned active orders
                          </Typography>
                        </Box>
                      ),
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Assigned Orders */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6">
                        {selectedDriver
                          ? `Orders Assigned to ${selectedDriver.name || selectedDriver.fullName || 'Driver'}`
                          : 'Assigned Active Orders'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Showing active orders that already have a driver. Use the Reassign button to change.
                      </Typography>
                    </Box>
                    <Chip
                      label={`${assignedActiveOrders.length} order(s)`}
                      color={assignedActiveOrders.length > 0 ? 'primary' : 'default'}
                    />
                  </Box>

                  <DataGrid
                    autoHeight
                    rows={assignedActiveOrders}
                    columns={assignedColumns}
                    getRowId={(row) => row.id}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 25]}
                    loading={loadingOrders}
                    disableSelectionOnClick
                    density="compact"
                    components={{
                      NoRowsOverlay: () => (
                        <Box p={2}>
                          <Typography variant="body2" color="textSecondary">
                            No assigned active orders for this filter
                          </Typography>
                        </Box>
                      ),
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Assign / Reassign Dialog */}
      <Dialog open={assignDialogOpen} onClose={closeAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {orderBeingAssigned?.driverId ? 'Reassign Driver' : 'Assign Driver'}
        </DialogTitle>
        <DialogContent dividers>
          {orderBeingAssigned && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Order ID:{' '}
                <b>#{(orderBeingAssigned.id || '').slice(-8)}</b>
              </Typography>
              <Typography variant="body2" gutterBottom>
                Customer:{' '}
                <b>
                  {orderBeingAssigned.customerName ||
                    orderBeingAssigned.deliveryAddress?.name ||
                    'Unknown'}
                </b>
              </Typography>
              <Typography variant="body2" gutterBottom>
                Current Assignment:{' '}
                {orderBeingAssigned.driverId ? (
                  <Chip
                    label={
                      orderBeingAssigned.driverName ||
                      drivers.find((d) => d.id === orderBeingAssigned.driverId)?.name ||
                      'Assigned Driver'
                    }
                    color="success"
                    size="small"
                  />
                ) : (
                  <Chip label="Unassigned" color="warning" size="small" />
                )}
              </Typography>

              <Box mt={3}>
                <TextField
                  select
                  fullWidth
                  label="Select Driver"
                  value={selectedDriverForAssign}
                  onChange={(e) => setSelectedDriverForAssign(e.target.value)}
                >
                  {drivers.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name || d.fullName || 'Unnamed'}{' '}
                      {d.phone ? `(${d.phone})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAssignDialog}>Cancel</Button>
          <Button
            onClick={handleAssignDriver}
            variant="contained"
            startIcon={<LocalShippingIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverOrdersManagement;
