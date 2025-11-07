import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Typography,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { toast } from 'react-toastify';
import imageCompression from 'browser-image-compression';

// Comprehensive unit types for different grocery categories
const UNIT_TYPES = [
  // Weight units
  { value: 'g', label: 'Gram (g)', type: 'weight', category: 'Weight' },
  { value: 'kg', label: 'Kilogram (kg)', type: 'weight', category: 'Weight' },
  { value: 'mg', label: 'Milligram (mg)', type: 'weight', category: 'Weight' },
  { value: 'lb', label: 'Pound (lb)', type: 'weight', category: 'Weight' },
  
  // Volume units
  { value: 'ml', label: 'Milliliter (ml)', type: 'volume', category: 'Volume' },
  { value: 'l', label: 'Liter (l)', type: 'volume', category: 'Volume' },
  
  // Quantity units
  { value: 'pc', label: 'Piece (pc)', type: 'quantity', category: 'Quantity' },
  { value: 'dozen', label: 'Dozen', type: 'quantity', category: 'Quantity' },
  { value: 'pack', label: 'Pack', type: 'quantity', category: 'Quantity' },
  { value: 'bunch', label: 'Bunch', type: 'quantity', category: 'Quantity' },
  { value: 'bottle', label: 'Bottle', type: 'quantity', category: 'Quantity' },
  { value: 'jar', label: 'Jar', type: 'quantity', category: 'Quantity' },
  { value: 'can', label: 'Can', type: 'quantity', category: 'Quantity' },
  { value: 'box', label: 'Box', type: 'quantity', category: 'Quantity' },
  { value: 'packet', label: 'Packet', type: 'quantity', category: 'Quantity' },
  { value: 'carton', label: 'Carton', type: 'quantity', category: 'Quantity' },
];

// Common grocery categories with suggested units
const GROCERY_CATEGORIES = [
  { name: 'Fruits & Vegetables', suggestedUnits: ['kg', 'g', 'pc', 'bunch', 'pack'] },
  { name: 'Dairy & Eggs', suggestedUnits: ['l', 'ml', 'pc', 'dozen', 'pack'] },
  { name: 'Meat & Poultry', suggestedUnits: ['kg', 'g', 'pc', 'pack'] },
  { name: 'Fish & Seafood', suggestedUnits: ['kg', 'g', 'pc'] },
  { name: 'Grains & Pulses', suggestedUnits: ['kg', 'g', 'pack'] },
  { name: 'Oils & Ghee', suggestedUnits: ['l', 'ml', 'bottle', 'jar'] },
  { name: 'Spices & Masalas', suggestedUnits: ['g', 'kg', 'pack', 'bottle'] },
  { name: 'Bakery & Snacks', suggestedUnits: ['pc', 'pack', 'box'] },
  { name: 'Beverages', suggestedUnits: ['l', 'ml', 'bottle', 'can', 'pack'] },
  { name: 'Frozen Foods', suggestedUnits: ['g', 'kg', 'pack'] },
  { name: 'Personal Care', suggestedUnits: ['pc', 'bottle', 'pack'] },
  { name: 'Household Items', suggestedUnits: ['pc', 'bottle', 'pack'] },
  { name: 'Other', suggestedUnits: ['pc', 'pack'] },
];

const GroceryItems = () => {
  const [groceryItems, setGroceryItems] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    isActive: true,
    image: null,
    unit: 'pc',
    quantity: 1,
    baseUnit: 'pc',
    baseQuantity: 1,
    maxQuantity: 10,
    minQuantity: 1,
    increment: 1,
  });

  useEffect(() => {
    fetchGroceryItems();
  }, []);

  const fetchGroceryItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'groceryItems'));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroceryItems(items);
    } catch (error) {
      toast.error('Error fetching grocery items');
      console.error('Error:', error);
    }
  };

  // Get suggested units based on category
  const getSuggestedUnits = (category) => {
    const categoryData = GROCERY_CATEGORIES.find(cat => cat.name === category);
    if (categoryData) {
      return UNIT_TYPES.filter(unit => categoryData.suggestedUnits.includes(unit.value));
    }
    return UNIT_TYPES;
  };

  // Group units by category for better dropdown organization
  const groupedUnits = UNIT_TYPES.reduce((acc, unit) => {
    if (!acc[unit.category]) {
      acc[unit.category] = [];
    }
    acc[unit.category].push(unit);
    return acc;
  }, {});

  // Image compression function - 200KB max size
  const compressImage = async (imageFile) => {
    try {
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.7,
        maxIteration: 10,
      };

      const compressedFile = await imageCompression(imageFile, options);
      const previewUrl = await imageCompression.getDataUrlFromFile(compressedFile);
      
      return {
        compressedFile,
        previewUrl
      };
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Error compressing image');
      throw error;
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        category: item.category || '',
        price: item.price || '',
        stock: item.stock || '',
        description: item.description || '',
        isActive: item.isActive !== undefined ? item.isActive : true,
        image: null,
        unit: item.unit || 'pc',
        quantity: item.quantity || 1,
        baseUnit: item.baseUnit || 'pc',
        baseQuantity: item.baseQuantity || 1,
        maxQuantity: item.maxQuantity || 10,
        minQuantity: item.minQuantity || 1,
        increment: item.increment || 1,
        imagePreview: item.image || null,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        price: '',
        stock: '',
        description: '',
        isActive: true,
        image: null,
        unit: 'pc',
        quantity: 1,
        baseUnit: 'pc',
        baseQuantity: 1,
        maxQuantity: 10,
        minQuantity: 1,
        increment: 1,
        imagePreview: null,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setUploading(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Auto-update suggested units when category changes
    if (name === 'category' && value) {
      const suggestedUnits = getSuggestedUnits(value);
      if (suggestedUnits.length > 0 && !suggestedUnits.find(unit => unit.value === formData.unit)) {
        setFormData(prev => ({
          ...prev,
          unit: suggestedUnits[0].value
        }));
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const { compressedFile, previewUrl } = await compressImage(file);
      
      setFormData(prev => ({
        ...prev,
        image: compressedFile,
        imagePreview: previewUrl,
      }));
      
      toast.success('Image compressed successfully');
    } catch (error) {
      console.error('Error handling image:', error);
      toast.error('Error processing image');
    } finally {
      setUploading(false);
    }
  };

  const uploadImageToFirebase = async (imageFile, itemId) => {
    try {
      const timestamp = Date.now();
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `grocery_${itemId || 'new'}_${timestamp}.${fileExtension}`;
      
      const storageRef = ref(storage, `grocery/${fileName}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageURL = editingItem?.image || '';

      if (formData.image) {
        imageURL = await uploadImageToFirebase(formData.image, editingItem?.id);
      }

      const groceryItemData = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        description: formData.description,
        isActive: formData.isActive,
        image: imageURL,
        unit: formData.unit,
        quantity: parseFloat(formData.quantity),
        baseUnit: formData.baseUnit,
        baseQuantity: parseFloat(formData.baseQuantity),
        maxQuantity: parseFloat(formData.maxQuantity),
        minQuantity: parseFloat(formData.minQuantity),
        increment: parseFloat(formData.increment),
        displayQuantity: `${formData.quantity} ${formData.unit}`,
        updatedAt: new Date(),
      };

      if (editingItem) {
        await updateDoc(doc(db, 'groceryItems', editingItem.id), groceryItemData);
        toast.success('Grocery item updated successfully');
      } else {
        groceryItemData.createdAt = new Date();
        await addDoc(collection(db, 'groceryItems'), groceryItemData);
        toast.success('Grocery item added successfully');
      }

      handleCloseDialog();
      fetchGroceryItems();
    } catch (error) {
      console.error('Error saving grocery item:', error);
      toast.error(error.message || 'Error saving grocery item');
    }

    setLoading(false);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this grocery item?')) {
      try {
        await updateDoc(doc(db, 'groceryItems', itemId), {
          isActive: false,
          updatedAt: new Date(),
        });
        toast.success('Grocery item deleted successfully');
        fetchGroceryItems();
      } catch (error) {
        toast.error('Error deleting grocery item');
        console.error('Error:', error);
      }
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await updateDoc(doc(db, 'groceryItems', item.id), {
        isActive: !item.isActive,
        updatedAt: new Date(),
      });
      toast.success(`Item ${!item.isActive ? 'enabled' : 'disabled'}`);
      fetchGroceryItems();
    } catch (error) {
      toast.error('Error updating item');
    }
  };

  // Show image preview in the form
  const renderImagePreview = () => {
    if (uploading) {
      return (
        <Box display="flex" alignItems="center" gap={1} mt={1}>
          <CircularProgress size={20} />
          <Typography variant="body2">Compressing image...</Typography>
        </Box>
      );
    }

    if (formData.imagePreview) {
      return (
        <Box mt={1}>
          <Typography variant="body2" gutterBottom>
            Image Preview:
          </Typography>
          <img 
            src={formData.imagePreview} 
            alt="Preview" 
            style={{ 
              width: 100, 
              height: 100, 
              objectFit: 'cover', 
              borderRadius: 4,
              border: '1px solid #e0e0e0'
            }}
          />
        </Box>
      );
    }
    return null;
  };

  const columns = [
    { 
      field: 'image', 
      headerName: 'Image', 
      width: 80,
      renderCell: (params) => (
        params.value ? (
          <img 
            src={params.value} 
            alt="" 
            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div style={{ width: 50, height: 50, backgroundColor: '#f5f5f5', borderRadius: 4 }} />
        )
      ),
    },
    { field: 'name', headerName: 'Name', width: 180 },
    { field: 'category', headerName: 'Category', width: 150 },
    { 
      field: 'displayQuantity', 
      headerName: 'Quantity', 
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color="primary"
          variant="outlined"
          size="small"
        />
      ),
    },
    { 
      field: 'price', 
      headerName: 'Price', 
      width: 100,
      renderCell: (params) => `₹${params.value?.toFixed(2)}`,
    },
    { 
      field: 'stock', 
      headerName: 'Stock', 
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value > 10 ? 'success' : params.value > 0 ? 'warning' : 'error'}
          size="small"
        />
      ),
    },
    { 
      field: 'isActive', 
      headerName: 'Active', 
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            onClick={() => toggleAvailability(params.row)}
            size="small"
            color={params.row.isActive ? 'secondary' : 'primary'}
          >
            {params.row.isActive ? 'Disable' : 'Enable'}
          </IconButton>
          <IconButton
            onClick={() => handleOpenDialog(params.row)}
            color="primary"
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => handleDelete(params.row.id)}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Grocery Items Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Grocery Item
        </Button>
      </Box>

      <Card>
        <CardContent>
          <DataGrid
            rows={groceryItems}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            autoHeight
            disableSelectionOnClick
          />
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Grocery Item' : 'Add New Grocery Item'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Item Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    label="Category"
                    required
                  >
                    {GROCERY_CATEGORIES.map((category) => (
                      <MenuItem key={category.name} value={category.name}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Quantity and Unit Section */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  inputProps={{ step: '0.01', min: '0.01' }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <FormControl sx={{ minWidth: 120 }} size="small">
                          <Select
                            name="unit"
                            value={formData.unit}
                            onChange={handleInputChange}
                            sx={{ border: 'none', '& fieldset': { border: 'none' } }}
                          >
                            {Object.keys(groupedUnits).map((category) => [
                              <MenuItem 
                                key={category} 
                                disabled 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  backgroundColor: '#f5f5f5',
                                  '&.Mui-disabled': { opacity: 1 }
                                }}
                              >
                                {category}
                              </MenuItem>,
                              ...groupedUnits[category].map((unit) => (
                                <MenuItem key={unit.value} value={unit.value}>
                                  {unit.label}
                                </MenuItem>
                              ))
                            ])}
                          </Select>
                        </FormControl>
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Displayed as: {formData.quantity} {formData.unit}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price (₹)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  inputProps={{ step: '0.01', min: '0' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Price for {formData.quantity} {formData.unit}
                </Typography>
              </Grid>

              {/* Quantity Settings */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Min Quantity"
                  name="minQuantity"
                  type="number"
                  value={formData.minQuantity}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  inputProps={{ step: '0.01', min: '0.01' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Max Quantity"
                  name="maxQuantity"
                  type="number"
                  value={formData.maxQuantity}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  inputProps={{ step: '0.01', min: '0.01' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Quantity Increment"
                  name="increment"
                  type="number"
                  value={formData.increment}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  inputProps={{ step: '0.01', min: '0.01' }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stock Quantity"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  inputProps={{ min: '0' }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <Box>
                  <input
                    accept="image/*"
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="grocery-image-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="grocery-image-upload">
                    <Button 
                      variant="outlined" 
                      component="span"
                      disabled={uploading}
                      startIcon={uploading ? <CircularProgress size={16} /> : null}
                    >
                      {uploading ? 'Compressing...' : 'Upload Image (Optional)'}
                    </Button>
                  </label>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Max file size: 5MB | Compressed to: 200KB | Supported formats: JPG, PNG, WebP
                  </Typography>
                  {renderImagePreview()}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading || uploading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? 'Saving...' : editingItem ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default GroceryItems;