// src/components/Admin/AppSettings.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Paper,
  Tab,
  Tabs,
  Snackbar,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const AppSettings = () => {
  const [settings, setSettings] = useState({
    // Delivery Settings
    groceryMinOrderValue: 100,
    foodMinOrderValue: 50,
    deliveryFeeGrocery: 20,
    deliveryFeeFood: 30,
    taxPercentage: 5,
    isGroceryMinOrderEnabled: true,
    isFoodMinOrderEnabled: true,
    
    // Delivery Zones
    deliveryZones: [
      {
        id: 'zone_1',
        name: 'City Center',
        zipCodes: ['10001', '10002', '10003'],
        deliveryFeeGrocery: 20,
        deliveryFeeFood: 30,
        minOrderGrocery: 100,
        minOrderFood: 50,
        deliveryTime: '15-25 min',
        isActive: true
      },
      {
        id: 'zone_2',
        name: 'Metro Area',
        zipCodes: ['10004', '10005', '10006'],
        deliveryFeeGrocery: 30,
        deliveryFeeFood: 40,
        minOrderGrocery: 150,
        minOrderFood: 75,
        deliveryTime: '25-35 min',
        isActive: true
      }
    ]
  });

  const [customerSupport, setCustomerSupport] = useState({
    phone: '+91-9876543210',
    email: 'support@quickbite.com',
    hours: '9:00 AM - 9:00 PM',
    whatsapp: '+91-9876543210',
    isActive: true,
    emergencySupport: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Zone Dialog State
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [newZone, setNewZone] = useState({
    name: '',
    zipCodes: '',
    deliveryFeeGrocery: 0,
    deliveryFeeFood: 0,
    minOrderGrocery: 0,
    minOrderFood: 0,
    deliveryTime: '',
    isActive: true
  });

  // Support Preview State
  const [supportPreview, setSupportPreview] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch delivery settings
      const deliveryDocRef = doc(db, 'appSettings', 'deliverySettings');
      const deliveryDocSnap = await getDoc(deliveryDocRef);
      
      // Fetch customer support settings
      const supportDocRef = doc(db, 'appSettings', 'customerSupport');
      const supportDocSnap = await getDoc(supportDocRef);
      
      if (deliveryDocSnap.exists()) {
        setSettings(prev => ({
          ...prev,
          ...deliveryDocSnap.data()
        }));
      }
      
      if (supportDocSnap.exists()) {
        setCustomerSupport(supportDocSnap.data());
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerSupportChange = (field, value) => {
    setCustomerSupport(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Save delivery settings
      const deliveryDocRef = doc(db, 'appSettings', 'deliverySettings');
      await setDoc(deliveryDocRef, settings, { merge: true });
      
      // Save customer support settings
      const supportDocRef = doc(db, 'appSettings', 'customerSupport');
      await setDoc(supportDocRef, customerSupport, { merge: true });
      
      toast.success('All settings saved successfully!');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Delivery Zone Functions
  const openZoneDialog = (zone = null) => {
    if (zone) {
      setEditingZone(zone);
      setNewZone({
        ...zone,
        zipCodes: zone.zipCodes.join(', ')
      });
    } else {
      setEditingZone(null);
      setNewZone({
        name: '',
        zipCodes: '',
        deliveryFeeGrocery: 0,
        deliveryFeeFood: 0,
        minOrderGrocery: 0,
        minOrderFood: 0,
        deliveryTime: '',
        isActive: true
      });
    }
    setZoneDialogOpen(true);
  };

  const closeZoneDialog = () => {
    setZoneDialogOpen(false);
    setEditingZone(null);
    setNewZone({
      name: '',
      zipCodes: '',
      deliveryFeeGrocery: 0,
      deliveryFeeFood: 0,
      minOrderGrocery: 0,
      minOrderFood: 0,
      deliveryTime: '',
      isActive: true
    });
  };

  const handleAddOrUpdateZone = () => {
    const zoneData = {
      ...newZone,
      zipCodes: newZone.zipCodes.split(',').map(zip => zip.trim()).filter(zip => zip),
      id: editingZone ? editingZone.id : `zone_${Date.now()}`
    };

    const updatedZones = editingZone
      ? settings.deliveryZones.map(zone => zone.id === editingZone.id ? zoneData : zone)
      : [...settings.deliveryZones, zoneData];

    handleSettingChange('deliveryZones', updatedZones);
    closeZoneDialog();
    toast.success(editingZone ? 'Zone updated!' : 'Zone added!');
  };

  const handleDeleteZone = (zoneId) => {
    const updatedZones = settings.deliveryZones.filter(zone => zone.id !== zoneId);
    handleSettingChange('deliveryZones', updatedZones);
    toast.success('Zone deleted!');
  };

  const toggleZoneActive = (zoneId) => {
    const updatedZones = settings.deliveryZones.map(zone =>
      zone.id === zoneId ? { ...zone, isActive: !zone.isActive } : zone
    );
    handleSettingChange('deliveryZones', updatedZones);
  };

  // Support Preview Functions
  const toggleSupportPreview = () => {
    setSupportPreview(!supportPreview);
  };

  const formatPhoneForDisplay = (phone) => {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Settings...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <SettingsIcon sx={{ fontSize: '2.5rem', mr: 2, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            App Settings
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage delivery zones, pricing, and customer support settings
          </Typography>
        </Box>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ Settings saved successfully! Changes will reflect immediately across the app.
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 600,
              py: 2,
            }
          }}
        >
          <Tab 
            icon={<LocalShippingIcon />} 
            label="Delivery Settings" 
            iconPosition="start" 
          />
          <Tab 
            icon={<SupportAgentIcon />} 
            label="Customer Support" 
            iconPosition="start" 
          />
        </Tabs>
      </Paper>

      {/* Delivery Settings Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Delivery Zones Management */}
          <Grid item xs={12}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Box display="flex" alignItems="center">
                    <LocationOnIcon sx={{ fontSize: '2rem', mr: 2, color: 'secondary.main' }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Delivery Zones Management
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Configure delivery areas, pricing, and timing
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openZoneDialog()}
                    size="large"
                    sx={{ borderRadius: 2 }}
                  >
                    Add New Zone
                  </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Zone Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>ZIP Codes</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Grocery Fee</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Food Fee</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Delivery Time</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {settings.deliveryZones.map((zone) => (
                        <TableRow 
                          key={zone.id} 
                          sx={{ 
                            '&:hover': { backgroundColor: 'grey.50' },
                            opacity: zone.isActive ? 1 : 0.6
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight="600" fontSize="1rem">
                              {zone.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {zone.zipCodes.map((zip, index) => (
                                <Chip 
                                  key={index} 
                                  label={zip} 
                                  size="small" 
                                  variant="outlined" 
                                  color="primary"
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight="600" color="success.main">
                              ₹{zone.deliveryFeeGrocery}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight="600" color="primary.main">
                              ₹{zone.deliveryFeeFood}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={zone.deliveryTime} 
                              size="small" 
                              color="info" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={zone.isActive ? 'Active' : 'Inactive'}
                              color={zone.isActive ? 'success' : 'default'}
                              size="small"
                              onClick={() => toggleZoneActive(zone.id)}
                              clickable
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Edit Zone">
                                <IconButton 
                                  size="small" 
                                  onClick={() => openZoneDialog(zone)}
                                  color="primary"
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Zone">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteZone(zone.id)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {settings.deliveryZones.length === 0 && (
                  <Box textAlign="center" py={6}>
                    <LocationOnIcon sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No delivery zones configured
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Add your first delivery zone to start accepting orders
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => openZoneDialog()}
                    >
                      Create First Zone
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Grocery Settings */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <LocalGroceryStoreIcon sx={{ fontSize: '2rem', mr: 2, color: 'success.main' }} />
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    Grocery Settings
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.isGroceryMinOrderEnabled}
                      onChange={(e) => handleSettingChange('isGroceryMinOrderEnabled', e.target.checked)}
                      color="success"
                      size="large"
                    />
                  }
                  label={
                    <Typography variant="body1" fontWeight="500">
                      Enable Minimum Order Value
                    </Typography>
                  }
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Minimum Order Value (₹)"
                  type="number"
                  value={settings.groceryMinOrderValue}
                  onChange={(e) => handleSettingChange('groceryMinOrderValue', parseFloat(e.target.value) || 0)}
                  margin="normal"
                  disabled={!settings.isGroceryMinOrderEnabled}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    inputProps: { min: 0, step: 10 }
                  }}
                  helperText="Minimum order amount required for grocery delivery"
                  variant="outlined"
                />

                <TextField
                  fullWidth
                  label="Default Delivery Fee (₹)"
                  type="number"
                  value={settings.deliveryFeeGrocery}
                  onChange={(e) => handleSettingChange('deliveryFeeGrocery', parseFloat(e.target.value) || 0)}
                  margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                  helperText="Base delivery fee for grocery orders"
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Food Settings */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <RestaurantIcon sx={{ fontSize: '2rem', mr: 2, color: 'primary.main' }} />
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    Food Settings
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.isFoodMinOrderEnabled}
                      onChange={(e) => handleSettingChange('isFoodMinOrderEnabled', e.target.checked)}
                      color="primary"
                      size="large"
                    />
                  }
                  label={
                    <Typography variant="body1" fontWeight="500">
                      Enable Minimum Order Value
                    </Typography>
                  }
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Minimum Order Value (₹)"
                  type="number"
                  value={settings.foodMinOrderValue}
                  onChange={(e) => handleSettingChange('foodMinOrderValue', parseFloat(e.target.value) || 0)}
                  margin="normal"
                  disabled={!settings.isFoodMinOrderEnabled}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    inputProps: { min: 0, step: 10 }
                  }}
                  helperText="Minimum order amount required for food delivery"
                  variant="outlined"
                />

                <TextField
                  fullWidth
                  label="Default Delivery Fee (₹)"
                  type="number"
                  value={settings.deliveryFeeFood}
                  onChange={(e) => handleSettingChange('deliveryFeeFood', parseFloat(e.target.value) || 0)}
                  margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                  helperText="Base delivery fee for food orders"
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Tax Settings */}
          <Grid item xs={12}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AccountBalanceIcon sx={{ fontSize: '2rem', mr: 2, color: 'warning.main' }} />
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    Tax & Charges
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tax Percentage (%)"
                      type="number"
                      value={settings.taxPercentage}
                      onChange={(e) => handleSettingChange('taxPercentage', parseFloat(e.target.value) || 0)}
                      margin="normal"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 0, max: 100, step: 0.1 }
                      }}
                      helperText="Tax percentage applied to all orders"
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Customer Support Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <SupportAgentIcon sx={{ fontSize: '2.5rem', mr: 2, color: 'info.main' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      Customer Support Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Configure customer support contact information and availability
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 4 }} />

                <Grid container spacing={4}>
                  {/* Support Toggle */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={customerSupport.isActive}
                          onChange={(e) => handleCustomerSupportChange('isActive', e.target.checked)}
                          color="primary"
                          size="large"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="h6" fontWeight="600">
                            Enable Customer Support
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Show support contact information to customers
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>

                  {/* Phone Support */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Support Phone Number"
                      value={customerSupport.phone}
                      onChange={(e) => handleCustomerSupportChange('phone', e.target.value)}
                      margin="normal"
                      placeholder="+91-9876543210"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Primary customer support phone number"
                      variant="outlined"
                      disabled={!customerSupport.isActive}
                    />
                  </Grid>

                  {/* WhatsApp Support */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="WhatsApp Number"
                      value={customerSupport.whatsapp}
                      onChange={(e) => handleCustomerSupportChange('whatsapp', e.target.value)}
                      margin="normal"
                      placeholder="+91-9876543210"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography color="success.main">💬</Typography>
                          </InputAdornment>
                        ),
                      }}
                      helperText="WhatsApp number for customer support"
                      variant="outlined"
                      disabled={!customerSupport.isActive}
                    />
                  </Grid>

                  {/* Email Support */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Support Email"
                      type="email"
                      value={customerSupport.email}
                      onChange={(e) => handleCustomerSupportChange('email', e.target.value)}
                      margin="normal"
                      placeholder="support@quickbite.com"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Customer support email address"
                      variant="outlined"
                      disabled={!customerSupport.isActive}
                    />
                  </Grid>

                  {/* Support Hours */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Support Hours"
                      value={customerSupport.hours}
                      onChange={(e) => handleCustomerSupportChange('hours', e.target.value)}
                      margin="normal"
                      placeholder="9:00 AM - 9:00 PM"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ScheduleIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Customer support operating hours"
                      variant="outlined"
                      disabled={!customerSupport.isActive}
                    />
                  </Grid>

                  {/* Emergency Support */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={customerSupport.emergencySupport}
                          onChange={(e) => handleCustomerSupportChange('emergencySupport', e.target.checked)}
                          color="secondary"
                          size="large"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="h6" fontWeight="600">
                            24/7 Emergency Support
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Provide emergency support outside regular hours
                          </Typography>
                        </Box>
                      }
                      disabled={!customerSupport.isActive}
                    />
                  </Grid>

                  {/* Preview Section */}
                  <Grid item xs={12}>
                    <Box sx={{ mt: 4 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="h6" fontWeight="bold">
                          Customer Preview
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={toggleSupportPreview}
                          startIcon={<SupportAgentIcon />}
                        >
                          {supportPreview ? 'Hide Preview' : 'Show Preview'}
                        </Button>
                      </Box>

                      {supportPreview && (
                        <Box 
                          sx={{ 
                            p: 4, 
                            bgcolor: 'grey.50', 
                            borderRadius: 3, 
                            border: 1, 
                            borderColor: 'grey.300' 
                          }}
                        >
                          <Typography variant="h6" fontWeight="bold" gutterBottom color="primary.main">
                            📞 Customer Support
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            This is how your support information appears to customers
                          </Typography>

                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: 1, borderColor: 'green.200' }}>
                                <Box display="flex" alignItems="center" mb={2}>
                                  <PhoneIcon sx={{ color: 'green.600', mr: 2 }} />
                                  <Typography variant="body1" fontWeight="600">
                                    Call Support
                                  </Typography>
                                </Box>
                                <Typography variant="h6" color="green.700" fontWeight="bold">
                                  {formatPhoneForDisplay(customerSupport.phone.replace(/\D/g, ''))}
                                </Typography>
                                <Button 
                                  variant="contained" 
                                  color="success" 
                                  size="small" 
                                  sx={{ mt: 1 }}
                                  disabled={!customerSupport.isActive}
                                >
                                  Call Now
                                </Button>
                              </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: 1, borderColor: 'green.200' }}>
                                <Box display="flex" alignItems="center" mb={2}>
                                  <Typography sx={{ mr: 2 }}>💬</Typography>
                                  <Typography variant="body1" fontWeight="600">
                                    WhatsApp
                                  </Typography>
                                </Box>
                                <Typography variant="body1" color="text.primary">
                                  {formatPhoneForDisplay(customerSupport.whatsapp.replace(/\D/g, ''))}
                                </Typography>
                                <Button 
                                  variant="contained" 
                                  color="success" 
                                  size="small" 
                                  sx={{ mt: 1 }}
                                  disabled={!customerSupport.isActive}
                                >
                                  Message
                                </Button>
                              </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: 1, borderColor: 'blue.200' }}>
                                <Box display="flex" alignItems="center" mb={2}>
                                  <EmailIcon sx={{ color: 'blue.600', mr: 2 }} />
                                  <Typography variant="body1" fontWeight="600">
                                    Email Support
                                  </Typography>
                                </Box>
                                <Typography variant="body1" color="blue.700">
                                  {customerSupport.email}
                                </Typography>
                                <Button 
                                  variant="contained" 
                                  color="primary" 
                                  size="small" 
                                  sx={{ mt: 1 }}
                                  disabled={!customerSupport.isActive}
                                >
                                  Send Email
                                </Button>
                              </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: 1, borderColor: 'orange.200' }}>
                                <Box display="flex" alignItems="center" mb={2}>
                                  <AccessTimeIcon sx={{ color: 'orange.600', mr: 2 }} />
                                  <Typography variant="body1" fontWeight="600">
                                    Support Hours
                                  </Typography>
                                </Box>
                                <Typography variant="body1" color="orange.700" fontWeight="500">
                                  {customerSupport.hours}
                                </Typography>
                                {customerSupport.emergencySupport && (
                                  <Chip 
                                    label="24/7 Emergency" 
                                    color="error" 
                                    size="small" 
                                    sx={{ mt: 1 }}
                                  />
                                )}
                              </Box>
                            </Grid>
                          </Grid>

                          {!customerSupport.isActive && (
                            <Alert severity="warning" sx={{ mt: 3 }}>
                              Customer support is currently disabled. Customers will not see this information.
                            </Alert>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Save Button */}
      <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
          sx={{ 
            px: 6, 
            py: 2, 
            fontSize: '1.1rem',
            borderRadius: 3,
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {saving ? 'Saving Changes...' : 'Save All Settings'}
        </Button>
      </Box>

      {/* Add/Edit Zone Dialog */}
      <Dialog 
        open={zoneDialogOpen} 
        onClose={closeZoneDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h5" fontWeight="bold">
            {editingZone ? 'Edit Delivery Zone' : 'Add New Delivery Zone'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Zone Name"
                value={newZone.name}
                onChange={(e) => setNewZone({...newZone, name: e.target.value})}
                placeholder="e.g., City Center, Metro Area, Rural Zone"
                variant="outlined"
                helperText="Descriptive name for this delivery area"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ZIP Codes"
                value={newZone.zipCodes}
                onChange={(e) => setNewZone({...newZone, zipCodes: e.target.value})}
                placeholder="Enter comma-separated ZIP codes (10001, 10002, 10003)"
                helperText="Separate multiple ZIP codes with commas"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Grocery Delivery Fee (₹)"
                type="number"
                value={newZone.deliveryFeeGrocery}
                onChange={(e) => setNewZone({...newZone, deliveryFeeGrocery: parseFloat(e.target.value) || 0})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0 }
                }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Food Delivery Fee (₹)"
                type="number"
                value={newZone.deliveryFeeFood}
                onChange={(e) => setNewZone({...newZone, deliveryFeeFood: parseFloat(e.target.value) || 0})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0 }
                }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Min Order Grocery (₹)"
                type="number"
                value={newZone.minOrderGrocery}
                onChange={(e) => setNewZone({...newZone, minOrderGrocery: parseFloat(e.target.value) || 0})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0 }
                }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Min Order Food (₹)"
                type="number"
                value={newZone.minOrderFood}
                onChange={(e) => setNewZone({...newZone, minOrderFood: parseFloat(e.target.value) || 0})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0 }
                }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Delivery Time Estimate</InputLabel>
                <Select
                  value={newZone.deliveryTime}
                  onChange={(e) => setNewZone({...newZone, deliveryTime: e.target.value})}
                  label="Delivery Time Estimate"
                >
                  <MenuItem value="15-25 min">15-25 minutes</MenuItem>
                  <MenuItem value="25-35 min">25-35 minutes</MenuItem>
                  <MenuItem value="35-45 min">35-45 minutes</MenuItem>
                  <MenuItem value="45-60 min">45-60 minutes</MenuItem>
                  <MenuItem value="60-90 min">60-90 minutes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newZone.isActive}
                    onChange={(e) => setNewZone({...newZone, isActive: e.target.checked})}
                    color="primary"
                  />
                }
                label="Zone Active (Accepting orders for this zone)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={closeZoneDialog} size="large">
            Cancel
          </Button>
          <Button 
            onClick={handleAddOrUpdateZone} 
            variant="contained"
            disabled={!newZone.name || !newZone.zipCodes}
            size="large"
          >
            {editingZone ? 'Update Zone' : 'Add Zone'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppSettings;