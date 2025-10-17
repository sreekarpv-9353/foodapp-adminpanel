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

// Comprehensive list of Indian grocery unicode emojis
const GROCERY_UNICODES = [
  // Fruits
  { category: 'Fruits', name: 'Apple', unicode: '🍎', keywords: 'apple fruit seb' },
  { category: 'Fruits', name: 'Banana', unicode: '🍌', keywords: 'banana fruit kela' },
  { category: 'Fruits', name: 'Orange', unicode: '🍊', keywords: 'orange fruit citrus santara' },
  { category: 'Fruits', name: 'Mango', unicode: '🥭', keywords: 'mango fruit aam' },
  { category: 'Fruits', name: 'Coconut', unicode: '🥥', keywords: 'coconut fruit nariyal thengai' },
  { category: 'Fruits', name: 'Lemon', unicode: '🍋', keywords: 'lemon fruit citrus nimbu elumichai' },
  { category: 'Fruits', name: 'Pomegranate', unicode: '🍒', keywords: 'pomegranate anar mathalam' },
  { category: 'Fruits', name: 'Guava', unicode: '🫒', keywords: 'guava fruit amrood peru' },
  
  // Vegetables
  { category: 'Vegetables', name: 'Tomato', unicode: '🍅', keywords: 'tomato vegetable tamatar thakkali' },
  { category: 'Vegetables', name: 'Onion', unicode: '🧅', keywords: 'onion pyaz vengayam' },
  { category: 'Vegetables', name: 'Potato', unicode: '🥔', keywords: 'potato aloo urulaikizhangu' },
  { category: 'Vegetables', name: 'Carrot', unicode: '🥕', keywords: 'carrot vegetable gajar' },
  { category: 'Vegetables', name: 'Green Chili', unicode: '🌶️', keywords: 'green chili pepper hari mirch pachai milagai' },
  { category: 'Vegetables', name: 'Garlic', unicode: '🧄', keywords: 'garlic lahsun poondu' },
  { category: 'Vegetables', name: 'Ginger', unicode: '🫚', keywords: 'ginger adrak inji' },
  { category: 'Vegetables', name: 'Okra', unicode: '🥒', keywords: 'okra bhindi ladyfinger vendakkai' },
  { category: 'Vegetables', name: 'Drumstick', unicode: '🥒', keywords: 'drumstick moringa murungakkai' },
  
  // Grains & Flours
  { category: 'Grains & Flours', name: 'Rice', unicode: '🍚', keywords: 'rice chawal arisi' },
  { category: 'Grains & Flours', name: 'Wheat Flour', unicode: '🌾', keywords: 'wheat flour atta godumai maavu' },
  { category: 'Grains & Flours', name: 'Maida', unicode: '🌾', keywords: 'maida all purpose flour refined flour' },
  { category: 'Grains & Flours', name: 'Rava', unicode: '🌾', keywords: 'rava sooji semolina ravai bombay rava' },
  { category: 'Grains & Flours', name: 'Besan', unicode: '🌾', keywords: 'besan gram flour chickpea flour kadalai maavu' },
  { category: 'Grains & Flours', name: 'Rice Flour', unicode: '🌾', keywords: 'rice flour arisi maavu' },
  
  // Pulses
  { category: 'Pulses & Lentils', name: 'Toor Dal', unicode: '🫘', keywords: 'toor dal arhar pigeon pea thuvaram paruppu' },
  { category: 'Pulses & Lentils', name: 'Moong Dal', unicode: '🫘', keywords: 'moong dal green gram payatham paruppu' },
  { category: 'Pulses & Lentils', name: 'Urad Dal', unicode: '🫘', keywords: 'urad dal black gram ulundu' },
  { category: 'Pulses & Lentils', name: 'Chana Dal', unicode: '🫘', keywords: 'chana dal bengal gram kadalai paruppu' },
  
  // Dairy
  { category: 'Dairy', name: 'Milk', unicode: '🥛', keywords: 'milk dairy doodh paal' },
  { category: 'Dairy', name: 'Curd', unicode: '🥛', keywords: 'curd yogurt dahi thayir' },
  { category: 'Dairy', name: 'Paneer', unicode: '🧀', keywords: 'paneer cottage cheese' },
  { category: 'Dairy', name: 'Ghee', unicode: '🧈', keywords: 'ghee clarified butter nei' },
  { category: 'Dairy', name: 'Butter', unicode: '🧈', keywords: 'butter venna makhan' },
  { category: 'Dairy', name: 'Egg', unicode: '🥚', keywords: 'egg anda muttai' },
  
  // Oils
  { category: 'Oils', name: 'Sunflower Oil', unicode: '🫗', keywords: 'sunflower oil cooking surajmukhi tel' },
  { category: 'Oils', name: 'Coconut Oil', unicode: '🥥', keywords: 'coconut oil nariyal tel thengai ennai' },
  { category: 'Oils', name: 'Mustard Oil', unicode: '🫗', keywords: 'mustard oil sarson tel kadugu ennai' },
  
  // Spices
  { category: 'Spices', name: 'Turmeric', unicode: '🌿', keywords: 'turmeric haldi manjal' },
  { category: 'Spices', name: 'Red Chili Powder', unicode: '🌶️', keywords: 'red chili powder lal mirch podi' },
  { category: 'Spices', name: 'Coriander Powder', unicode: '🌿', keywords: 'coriander powder dhania kothamalli podi' },
  { category: 'Spices', name: 'Cumin Seeds', unicode: '🌿', keywords: 'cumin jeera seeragam' },
  { category: 'Spices', name: 'Mustard Seeds', unicode: '🌿', keywords: 'mustard seeds rai kadugu' },
  { category: 'Spices', name: 'Black Pepper', unicode: '🌿', keywords: 'black pepper kali mirch milagu' },
  { category: 'Spices', name: 'Curry Leaves', unicode: '🌿', keywords: 'curry leaves kadi patta kariveppilai' },
  
  // Masala Powders
  { category: 'Masala Powders', name: 'Garam Masala', unicode: '🌿', keywords: 'garam masala spice mix' },
  { category: 'Masala Powders', name: 'Sambar Powder', unicode: '🌿', keywords: 'sambar powder masala' },
  { category: 'Masala Powders', name: 'Rasam Powder', unicode: '🌿', keywords: 'rasam powder masala' },
  { category: 'Masala Powders', name: 'Chicken Masala', unicode: '🍗', keywords: 'chicken masala powder' },
  { category: 'Masala Powders', name: 'Fish Masala', unicode: '🐟', keywords: 'fish masala powder' },
  { category: 'Masala Powders', name: 'Biryani Masala', unicode: '🍛', keywords: 'biryani masala powder' },
  { category: 'Masala Powders', name: 'Chaat Masala', unicode: '🌿', keywords: 'chaat masala powder' },
  
  // Sweeteners
  { category: 'Sweeteners', name: 'Sugar', unicode: '🧂', keywords: 'sugar chini sakkarai' },
  { category: 'Sweeteners', name: 'Jaggery', unicode: '🧂', keywords: 'jaggery gur vellam' },
  { category: 'Sweeteners', name: 'Honey', unicode: '🍯', keywords: 'honey shahad then' },
  
  // Condiments
  { category: 'Condiments', name: 'Salt', unicode: '🧂', keywords: 'salt namak uppu' },
  { category: 'Condiments', name: 'Tamarind', unicode: '🌰', keywords: 'tamarind imli puli' },
  { category: 'Condiments', name: 'Pickle', unicode: '🥒', keywords: 'pickle achar oorugai' },
  { category: 'Condiments', name: 'Ketchup', unicode: '🍅', keywords: 'tomato ketchup sauce' },
  
  // Snacks
  { category: 'Snacks', name: 'Biscuits', unicode: '🍪', keywords: 'biscuits cookies' },
  { category: 'Snacks', name: 'Chips', unicode: '🥨', keywords: 'chips lays potato' },
  { category: 'Snacks', name: 'Namkeen', unicode: '🥨', keywords: 'namkeen mixture' },
  { category: 'Snacks', name: 'Papad', unicode: '🍪', keywords: 'papad papadam appalam' },
  { category: 'Snacks', name: 'Murukku', unicode: '🥨', keywords: 'murukku chakli' },
  
  // Street Food
  { category: 'Street Food', name: 'Pani Puri Kit', unicode: '🥟', keywords: 'pani puri golgappa kit packet' },
  { category: 'Street Food', name: 'Bhel Mix', unicode: '🥨', keywords: 'bhel puri mix' },
  { category: 'Street Food', name: 'Samosa', unicode: '🥟', keywords: 'samosa frozen' },
  
  // Instant Foods
  { category: 'Instant Foods', name: 'Maggi', unicode: '🍜', keywords: 'maggi noodles instant' },
  { category: 'Instant Foods', name: 'Pasta', unicode: '🍝', keywords: 'pasta penne macaroni' },
  { category: 'Instant Foods', name: 'Oats', unicode: '🥣', keywords: 'oats quaker saffola' },
  { category: 'Instant Foods', name: 'Vermicelli', unicode: '🍜', keywords: 'vermicelli semiya sevai' },
  
  // Beverages
  { category: 'Beverages', name: 'Tea', unicode: '🍵', keywords: 'tea chai' },
  { category: 'Beverages', name: 'Coffee', unicode: '☕', keywords: 'coffee filter kaapi' },
  { category: 'Beverages', name: 'Juice', unicode: '🧃', keywords: 'juice pack real tropicana' },
  { category: 'Beverages', name: 'Soft Drink', unicode: '🥤', keywords: 'soft drink cola pepsi' },
  { category: 'Beverages', name: 'Water', unicode: '💧', keywords: 'water bottle mineral bisleri' },
  
  // Nuts
  { category: 'Nuts', name: 'Cashew', unicode: '🥜', keywords: 'cashew kaju munthiri' },
  { category: 'Nuts', name: 'Almonds', unicode: '🥜', keywords: 'almonds badam' },
  { category: 'Nuts', name: 'Peanuts', unicode: '🥜', keywords: 'peanuts moongfali verkadalai' },
  { category: 'Nuts', name: 'Raisins', unicode: '🍇', keywords: 'raisins kishmish thiratchai' },
  
  // Bakery
  { category: 'Bakery', name: 'Bread', unicode: '🍞', keywords: 'bread pav' },
  { category: 'Bakery', name: 'Cake', unicode: '🍰', keywords: 'cake pastry' },
  
  // Meat
  { category: 'Meat', name: 'Chicken', unicode: '🍗', keywords: 'chicken poultry kozhi' },
  { category: 'Meat', name: 'Fish', unicode: '🐟', keywords: 'fish machli meen' },
  { category: 'Meat', name: 'Prawns', unicode: '🦐', keywords: 'prawns shrimp jhinga eral' },
  
  // Household
  { category: 'Household', name: 'Soap', unicode: '🧼', keywords: 'soap sabun' },
  { category: 'Household', name: 'Detergent', unicode: '🧴', keywords: 'detergent washing powder' },
  { category: 'Household', name: 'Tissue', unicode: '🧻', keywords: 'tissue paper' },
  
  // Other
  { category: 'Other', name: 'Shopping Cart', unicode: '🛒', keywords: 'shopping cart grocery' },
  { category: 'Other', name: 'Package', unicode: '📦', keywords: 'box package' },
];

const GroceryItems = () => {
  const [groceryItems, setGroceryItems] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unicodeSearch, setUnicodeSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    isActive: true,
    image: null,
    unicode: '',
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
        unicode: item.unicode || '',
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
        unicode: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setUnicodeSearch('');
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

      if (formData.image) {
        const imageRef = ref(storage, `grocery/${Date.now()}_${formData.image.name}`);
        const snapshot = await uploadBytes(imageRef, formData.image);
        imageURL = await getDownloadURL(snapshot.ref);
      }

      const groceryItemData = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        description: formData.description,
        isActive: formData.isActive,
        image: imageURL,
        unicode: formData.unicode,
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
      toast.error('Error saving grocery item');
      console.error('Error:', error);
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

  const groupedUnicodes = GROCERY_UNICODES.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // Filter unicodes based on search
  const getFilteredUnicodes = () => {
    if (!unicodeSearch.trim()) {
      return groupedUnicodes;
    }

    const searchLower = unicodeSearch.toLowerCase();
    const filtered = {};

    Object.keys(groupedUnicodes).forEach((category) => {
      const matchingItems = groupedUnicodes[category].filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.keywords.toLowerCase().includes(searchLower)
      );

      if (matchingItems.length > 0) {
        filtered[category] = matchingItems;
      }
    });

    return filtered;
  };

  const filteredUnicodes = getFilteredUnicodes();

  const columns = [
    { 
      field: 'unicode', 
      headerName: 'Icon', 
      width: 70,
      renderCell: (params) => (
        <Typography variant="h4" sx={{ textAlign: 'center' }}>
          {params.value || '📦'}
        </Typography>
      ),
    },
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
    { field: 'category', headerName: 'Category', width: 130 },
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
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Select Icon (Unicode)</InputLabel>
                  <Select
                    name="unicode"
                    value={formData.unicode}
                    onChange={handleInputChange}
                    label="Select Icon (Unicode)"
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 450,
                        },
                      },
                      autoFocus: false,
                    }}
                    renderValue={(selected) => (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6">{selected}</Typography>
                        <Typography>
                          {GROCERY_UNICODES.find(u => u.unicode === selected)?.name || 'Select an icon'}
                        </Typography>
                      </Box>
                    )}
                  >
                    <Box 
                      sx={{ 
                        p: 2, 
                        position: 'sticky', 
                        top: 0, 
                        backgroundColor: 'white', 
                        zIndex: 1,
                        borderBottom: '1px solid #e0e0e0'
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="🔍 Search by name (e.g., tomato, rice, masala)..."
                        value={unicodeSearch}
                        onChange={(e) => setUnicodeSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus={false}
                        InputProps={{
                          sx: { backgroundColor: '#f5f5f5' }
                        }}
                      />
                    </Box>
                    {Object.keys(filteredUnicodes).length === 0 ? (
                      <MenuItem disabled>
                        <Typography color="textSecondary">No items found</Typography>
                      </MenuItem>
                    ) : (
                      Object.keys(filteredUnicodes).map((category) => [
                        <MenuItem 
                          key={category} 
                          disabled 
                          sx={{ 
                            fontWeight: 'bold', 
                            backgroundColor: '#f5f5f5',
                            '&.Mui-disabled': {
                              opacity: 1
                            }
                          }}
                        >
                          {category}
                        </MenuItem>,
                        ...filteredUnicodes[category].map((item) => (
                          <MenuItem key={item.unicode + item.name} value={item.unicode}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Typography variant="h5">{item.unicode}</Typography>
                              <Typography>{item.name}</Typography>
                            </Box>
                          </MenuItem>
                        ))
                      ])
                    )}
                  </Select>
                </FormControl>
              </Grid>

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
                  label="Price (₹)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  inputProps={{ step: '0.01', min: '0' }}
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
                <input
                  accept="image/*"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="grocery-image-upload"
                />
                <label htmlFor="grocery-image-upload">
                  <Button variant="outlined" component="span">
                    Upload Image (Optional)
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

export default GroceryItems;