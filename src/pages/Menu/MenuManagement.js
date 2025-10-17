import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { toast } from 'react-toastify';

const MenuManagement = () => {
  const { restaurantId } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    isAvailable: true,
    image: null,
  });

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant();
      fetchMenuItems();
    }
  }, [restaurantId]);

  const fetchRestaurant = async () => {
    try {
      const docRef = doc(db, 'restaurants', restaurantId);
      // In a real app, you would get the document data here
      setRestaurant({ id: restaurantId, name: 'Restaurant Name' });
    } catch (error) {
      toast.error('Error fetching restaurant');
    }
  };

  const fetchMenuItems = async () => {
    try {
      const q = query(
        collection(db, 'restaurants', restaurantId, 'menu'),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMenuItems(items);
    } catch (error) {
      toast.error('Error fetching menu items');
      console.error('Error:', error);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        category: item.category || '',
        price: item.price || '',
        description: item.description || '',
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
        image: null,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        price: '',
        description: '',
        isAvailable: true,
        image: null,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      image: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageURL = editingItem?.image || '';

      // Upload image if provided
      if (formData.image) {
        const imageRef = ref(storage, `menu/${restaurantId}/${Date.now()}_${formData.image.name}`);
        const snapshot = await uploadBytes(imageRef, formData.image);
        imageURL = await getDownloadURL(snapshot.ref);
      }

      const menuItemData = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description,
        isAvailable: formData.isAvailable,
        image: imageURL,
        updatedAt: new Date(),
      };

      if (editingItem) {
        // Update existing item
        await updateDoc(doc(db, 'restaurants', restaurantId, 'menu', editingItem.id), menuItemData);
        toast.success('Menu item updated successfully');
      } else {
        // Add new item
        menuItemData.createdAt = new Date();
        menuItemData.isActive = true;
        await addDoc(collection(db, 'restaurants', restaurantId, 'menu'), menuItemData);
        toast.success('Menu item added successfully');
      }

      handleCloseDialog();
      fetchMenuItems();
    } catch (error) {
      toast.error('Error saving menu item');
      console.error('Error:', error);
    }

    setLoading(false);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await updateDoc(doc(db, 'restaurants', restaurantId, 'menu', itemId), {
          isActive: false,
          updatedAt: new Date(),
        });
        toast.success('Menu item deleted successfully');
        fetchMenuItems();
      } catch (error) {
        toast.error('Error deleting menu item');
        console.error('Error:', error);
      }
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await updateDoc(doc(db, 'restaurants', restaurantId, 'menu', item.id), {
        isAvailable: !item.isAvailable,
        updatedAt: new Date(),
      });
      toast.success(`Item ${!item.isAvailable ? 'enabled' : 'disabled'}`);
      fetchMenuItems();
    } catch (error) {
      toast.error('Error updating item');
    }
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
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'category', headerName: 'Category', width: 150 },
    { 
      field: 'price', 
      headerName: 'Price', 
      width: 120,
      renderCell: (params) => `$${params.value}`,
    },
    { 
      field: 'isAvailable', 
      headerName: 'Available', 
      width: 120,
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
            color={params.row.isAvailable ? 'secondary' : 'primary'}
          >
            {params.row.isAvailable ? 'Disable' : 'Enable'}
          </IconButton>
          <IconButton
            onClick={() => handleOpenDialog(params.row)}
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => handleDelete(params.row.id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (!restaurantId) {
    return <Typography>No restaurant selected</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Menu Management - {restaurant?.name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Menu Item
        </Button>
      </Box>

      <Card>
        <CardContent>
          <DataGrid
            rows={menuItems}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            autoHeight
            disableSelectionOnClick
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
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
                <TextField
                  fullWidth
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  inputProps={{ step: '0.01', min: '0' }}
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
                <input
                  accept="image/*"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button variant="outlined" component="span">
                    Upload Image
                  </Button>
                </label>
                {formData.image && (
                  <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                    {formData.image.name}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleInputChange}
                    />
                  }
                  label="Available"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : editingItem ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default MenuManagement;