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
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
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

const AppSettings = () => {
  const [settings, setSettings] = useState({
    groceryMinOrderValue: 100,
    foodMinOrderValue: 50,
    deliveryFeeGrocery: 20,
    deliveryFeeFood: 30,
    taxPercentage: 5,
    isGroceryMinOrderEnabled: true,
    isFoodMinOrderEnabled: true,
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'appSettings', 'deliverySettings');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSettings(prev => ({
          ...prev,
          ...docSnap.data()
        }));
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

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, 'appSettings', 'deliverySettings');
      await setDoc(docRef, settings, { merge: true });
      
      toast.success('Settings saved successfully!');
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <SettingsIcon sx={{ fontSize: '2rem', mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">
          App Settings
        </Typography>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully! Changes will reflect immediately.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Delivery Zones Management */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="secondary.main" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOnIcon sx={{ mr: 1 }} />
                  Delivery Zones Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => openZoneDialog()}
                >
                  Add Zone
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Zone Name</TableCell>
                      <TableCell>ZIP Codes</TableCell>
                      <TableCell>Grocery Fee</TableCell>
                      <TableCell>Food Fee</TableCell>
                      <TableCell>Delivery Time</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {settings.deliveryZones.map((zone) => (
                      <TableRow key={zone.id}>
                        <TableCell>
                          <Typography fontWeight="medium">{zone.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {zone.zipCodes.map((zip, index) => (
                              <Chip key={index} label={zip} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>₹{zone.deliveryFeeGrocery}</TableCell>
                        <TableCell>₹{zone.deliveryFeeFood}</TableCell>
                        <TableCell>{zone.deliveryTime}</TableCell>
                        <TableCell>
                          <Chip
                            label={zone.isActive ? 'Active' : 'Inactive'}
                            color={zone.isActive ? 'success' : 'default'}
                            size="small"
                            onClick={() => toggleZoneActive(zone.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit Zone">
                            <IconButton size="small" onClick={() => openZoneDialog(zone)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Zone">
                            <IconButton size="small" onClick={() => handleDeleteZone(zone.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {settings.deliveryZones.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary">
                    No delivery zones configured. Add your first zone to get started.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Grocery Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                🛒 Grocery Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.isGroceryMinOrderEnabled}
                    onChange={(e) => handleSettingChange('isGroceryMinOrderEnabled', e.target.checked)}
                    color="success"
                  />
                }
                label="Enable Minimum Order Value for Grocery"
              />

              <TextField
                fullWidth
                label="Default Min Order (₹)"
                type="number"
                value={settings.groceryMinOrderValue}
                onChange={(e) => handleSettingChange('groceryMinOrderValue', parseFloat(e.target.value) || 0)}
                margin="normal"
                disabled={!settings.isGroceryMinOrderEnabled}
                InputProps={{ inputProps: { min: 0, step: 10 } }}
                helperText="Default minimum order amount for grocery"
              />

              <TextField
                fullWidth
                label="Default Delivery Fee (₹)"
                type="number"
                value={settings.deliveryFeeGrocery}
                onChange={(e) => handleSettingChange('deliveryFeeGrocery', parseFloat(e.target.value) || 0)}
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Default delivery fee for grocery"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Food Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center' }}>
                🍽️ Food Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.isFoodMinOrderEnabled}
                    onChange={(e) => handleSettingChange('isFoodMinOrderEnabled', e.target.checked)}
                    color="primary"
                  />
                }
                label="Enable Minimum Order Value for Food"
              />

              <TextField
                fullWidth
                label="Default Min Order (₹)"
                type="number"
                value={settings.foodMinOrderValue}
                onChange={(e) => handleSettingChange('foodMinOrderValue', parseFloat(e.target.value) || 0)}
                margin="normal"
                disabled={!settings.isFoodMinOrderEnabled}
                InputProps={{ inputProps: { min: 0, step: 10 } }}
                helperText="Default minimum order amount for food"
              />

              <TextField
                fullWidth
                label="Default Delivery Fee (₹)"
                type="number"
                value={settings.deliveryFeeFood}
                onChange={(e) => handleSettingChange('deliveryFeeFood', parseFloat(e.target.value) || 0)}
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Default delivery fee for food"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Tax Settings */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💰 Tax & Charges
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tax Percentage (%)"
                    type="number"
                    value={settings.taxPercentage}
                    onChange={(e) => handleSettingChange('taxPercentage', parseFloat(e.target.value) || 0)}
                    margin="normal"
                    InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                    helperText="Tax percentage applied to all orders"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
          sx={{ px: 4, py: 1.5 }}
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </Box>

      {/* Add/Edit Zone Dialog */}
      <Dialog open={zoneDialogOpen} onClose={closeZoneDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingZone ? 'Edit Delivery Zone' : 'Add New Delivery Zone'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Zone Name"
                value={newZone.name}
                onChange={(e) => setNewZone({...newZone, name: e.target.value})}
                placeholder="e.g., City Center, Metro Area"
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Grocery Delivery Fee (₹)"
                type="number"
                value={newZone.deliveryFeeGrocery}
                onChange={(e) => setNewZone({...newZone, deliveryFeeGrocery: parseFloat(e.target.value) || 0})}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Food Delivery Fee (₹)"
                type="number"
                value={newZone.deliveryFeeFood}
                onChange={(e) => setNewZone({...newZone, deliveryFeeFood: parseFloat(e.target.value) || 0})}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Min Order Grocery (₹)"
                type="number"
                value={newZone.minOrderGrocery}
                onChange={(e) => setNewZone({...newZone, minOrderGrocery: parseFloat(e.target.value) || 0})}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Min Order Food (₹)"
                type="number"
                value={newZone.minOrderFood}
                onChange={(e) => setNewZone({...newZone, minOrderFood: parseFloat(e.target.value) || 0})}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Delivery Time Estimate"
                value={newZone.deliveryTime}
                onChange={(e) => setNewZone({...newZone, deliveryTime: e.target.value})}
                placeholder="e.g., 15-25 min, 25-35 min"
              />
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
                label="Zone Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeZoneDialog}>Cancel</Button>
          <Button 
            onClick={handleAddOrUpdateZone} 
            variant="contained"
            disabled={!newZone.name || !newZone.zipCodes}
          >
            {editingZone ? 'Update Zone' : 'Add Zone'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppSettings;