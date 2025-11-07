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
  Menu,
  MenuItem,
  Avatar,
  Tabs,
  Tab,
  Chip,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Badge,
  Tooltip,
  Alert,
  FormGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
  MenuBook as MenuBookIcon,
  ArrowBack as ArrowBackIcon,
  DeliveryDining as DeliveryIcon,
  TakeoutDining as TakeoutIcon,
  Star as StarIcon,
  CloudUpload as UploadIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { restaurantService } from '../../services/firestoreService';
import { toast } from 'react-toastify';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openMenuDialog, setOpenMenuDialog] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [viewingMenus, setViewingMenus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [unicodeSearch, setUnicodeSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Enhanced form data with all required fields
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    description: '',
    cuisine: '',
    tags: [],
    
    // Contact Info
    ownerEmail: '',
    contact: '',
    ownerPhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // Business Hours
    openingTime: '09:00',
    closingTime: '23:00',
    workingDays: [0, 1, 2, 3, 4, 5, 6], // All days by default
    
    // Service Settings
    deliveryAvailable: true,
    takeawayAvailable: true,
    dineInAvailable: false,
    currentlyAcceptingOrders: true,
    deliveryRadius: 5, // in km
    deliveryFee: 0,
    packagingFee: 0,
    
    // Status & Ratings
    status: 'active',
    isActive: true,
    featured: false,
    rating: '4.0',
    totalRatings: 0,
    preparationTime: '25-30',
    
    // Media
    logo: null,
    logoPreview: '',
    
    // Financial
    commissionRate: 15,
    taxRate: 5,
    
    // Verification
    verified: false,
  });

  const [menuFormData, setMenuFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    available: true,
    image: '🍛',
    imageFile: null,
    imagePreview: '',
  });

  // Days of week
  const daysOfWeek = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
  ];

  // Time slots
  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
    }
  }

  // Cuisine types
  const cuisineTypes = [
    'North Indian', 'South Indian', 'Chinese', 'Italian', 'Mexican',
    'Continental', 'Thai', 'Japanese', 'American', 'Arabian',
    'Bengali', 'Gujarati', 'Punjabi', 'Rajasthani', 'Mughlai',
    'Fast Food', 'Desserts', 'Beverages', 'Street Food', 'Bakery'
  ];

  // Restaurant tags
  const restaurantTags = [
    'Pure Veg', 'Non-Veg', 'Eggitarian', 'Best Seller', 'Trending',
    'Family Restaurant', 'Fine Dining', 'Quick Bite', 'Budget Friendly',
    'Luxury Dining', 'Rooftop', 'Live Music', 'Outdoor Seating',
    'Free WiFi', 'Parking Available', 'Wheelchair Accessible'
  ];

  // Menu categories
  const menuCategories = [
    'Appetizers', 'Main Course', 'Biryani', 'Breads', 'Rice',
    'Chinese', 'South Indian', 'Desserts', 'Beverages', 'Snacks',
    'Salads', 'Soups', 'Pizza', 'Burger', 'Sandwiches',
    'Pasta', 'Seafood', 'Grill', 'Thali', 'Combos'
  ];

  // Food emojis for menu items
  const FOOD_EMOJIS = [
    { name: 'Biryani', unicode: '🍱', keywords: 'biryani rice hyderabadi' },
    { name: 'Curry', unicode: '🍛', keywords: 'curry gravy indian' },
    { name: 'Pizza', unicode: '🍕', keywords: 'pizza italian cheese' },
    { name: 'Burger', unicode: '🍔', keywords: 'burger american fast food' },
    { name: 'Noodles', unicode: '🍝', keywords: 'noodles chinese pasta' },
    { name: 'Dosa', unicode: '🫓', keywords: 'dosa south indian crispy' },
    { name: 'Idli', unicode: '⚪', keywords: 'idli south indian breakfast' },
    { name: 'Soup', unicode: '🍲', keywords: 'soup hot bowl' },
    { name: 'Salad', unicode: '🥗', keywords: 'salad healthy vegetables' },
    { name: 'Ice Cream', unicode: '🍨', keywords: 'ice cream dessert cold' },
    { name: 'Coffee', unicode: '☕', keywords: 'coffee hot beverage' },
    { name: 'Tea', unicode: '🍵', keywords: 'tea chai hot' },
    { name: 'Juice', unicode: '🧃', keywords: 'juice fresh fruit' },
    { name: 'Sandwich', unicode: '🥪', keywords: 'sandwich bread' },
    { name: 'Fries', unicode: '🍟', keywords: 'fries potato snack' },
    { name: 'Chicken', unicode: '🍗', keywords: 'chicken meat nonveg' },
    { name: 'Fish', unicode: '🐟', keywords: 'fish seafood' },
    { name: 'Vegetables', unicode: '🥦', keywords: 'vegetables veg healthy' },
    { name: 'Rice', unicode: '🍚', keywords: 'rice grain' },
    { name: 'Bread', unicode: '🥖', keywords: 'bread roti naan' },
  ];

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant && viewingMenus) {
      fetchMenuItems(selectedRestaurant.id);
    }
  }, [selectedRestaurant, viewingMenus]);

  const fetchRestaurants = async () => {
    try {
      const restaurantsData = await restaurantService.getRestaurants();
      setRestaurants(restaurantsData);
    } catch (error) {
      toast.error('Error fetching restaurants');
      console.error('Error:', error);
    }
  };

  const fetchMenuItems = async (restaurantId) => {
    try {
      const q = query(collection(db, 'menuItems'), where('restaurantId', '==', restaurantId));
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

  const handleOpenDialog = (restaurant = null) => {
    if (restaurant) {
      setEditingRestaurant(restaurant);
      setFormData({
        // Basic Info
        name: restaurant.name || '',
        description: restaurant.description || '',
        cuisine: restaurant.cuisine || '',
        tags: restaurant.tags || [],
        
        // Contact Info
        ownerEmail: restaurant.ownerEmail || '',
        contact: restaurant.contact || '',
        ownerPhone: restaurant.ownerPhone || '',
        address: restaurant.address || '',
        city: restaurant.city || '',
        state: restaurant.state || '',
        pincode: restaurant.pincode || '',
        
        // Business Hours
        openingTime: restaurant.openingTime || '09:00',
        closingTime: restaurant.closingTime || '23:00',
        workingDays: restaurant.workingDays || [0, 1, 2, 3, 4, 5, 6],
        
        // Service Settings
        deliveryAvailable: restaurant.deliveryAvailable !== undefined ? restaurant.deliveryAvailable : true,
        takeawayAvailable: restaurant.takeawayAvailable !== undefined ? restaurant.takeawayAvailable : true,
        dineInAvailable: restaurant.dineInAvailable || false,
        currentlyAcceptingOrders: restaurant.currentlyAcceptingOrders !== undefined ? restaurant.currentlyAcceptingOrders : true,
        deliveryRadius: restaurant.deliveryRadius || 5,
        deliveryFee: restaurant.deliveryFee || 0,
        packagingFee: restaurant.packagingFee || 0,
        
        // Status & Ratings
        status: restaurant.status || 'active',
        isActive: restaurant.isActive !== undefined ? restaurant.isActive : true,
        featured: restaurant.featured || false,
        rating: restaurant.rating || '4.0',
        totalRatings: restaurant.totalRatings || 0,
        preparationTime: restaurant.preparationTime || '25-30',
        
        // Media
        logo: null,
        logoPreview: restaurant.logo || '',
        
        // Financial
        commissionRate: restaurant.commissionRate || 15,
        taxRate: restaurant.taxRate || 5,
        
        // Verification
        verified: restaurant.verified || false,
      });
    } else {
      setEditingRestaurant(null);
      setFormData({
        name: '',
        description: '',
        cuisine: '',
        tags: [],
        ownerEmail: '',
        contact: '',
        ownerPhone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        openingTime: '09:00',
        closingTime: '23:00',
        workingDays: [0, 1, 2, 3, 4, 5, 6],
        deliveryAvailable: true,
        takeawayAvailable: true,
        dineInAvailable: false,
        currentlyAcceptingOrders: true,
        deliveryRadius: 5,
        deliveryFee: 0,
        packagingFee: 0,
        status: 'active',
        isActive: true,
        featured: false,
        rating: '4.0',
        totalRatings: 0,
        preparationTime: '25-30',
        logo: null,
        logoPreview: '',
        commissionRate: 15,
        taxRate: 5,
        verified: false,
      });
    }
    setActiveTab(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRestaurant(null);
  };

  const handleOpenMenuDialog = (menuItem = null) => {
    if (menuItem) {
      setEditingMenuItem(menuItem);
      setMenuFormData({
        name: menuItem.name || '',
        category: menuItem.category || '',
        price: menuItem.price || '',
        description: menuItem.description || '',
        available: menuItem.available !== undefined ? menuItem.available : true,
        image: menuItem.image || '🍛',
        imageFile: null,
        imagePreview: menuItem.imageUrl || '',
      });
    } else {
      setEditingMenuItem(null);
      setMenuFormData({
        name: '',
        category: '',
        price: '',
        description: '',
        available: true,
        image: '🍛',
        imageFile: null,
        imagePreview: '',
      });
    }
    setUnicodeSearch('');
    setOpenMenuDialog(true);
  };

  const handleCloseMenuDialog = () => {
    setOpenMenuDialog(false);
    setEditingMenuItem(null);
    setUnicodeSearch('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMenuInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMenuFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleArrayInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (field, file) => {
    if (file) {
      setFormData(prev => ({
        ...prev,
        [field]: file,
        [`${field}Preview`]: URL.createObjectURL(file),
      }));
    }
  };

  const handleMenuImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMenuFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const uploadImage = async (file, path) => {
    if (!file) return null;
    
    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logoURL = editingRestaurant?.logo || '';

      // Upload logo if provided
      if (formData.logo) {
        try {
          logoURL = await uploadImage(formData.logo, 'restaurants/logo');
          toast.success('Logo uploaded successfully');
        } catch (uploadError) {
          console.error('Logo upload failed:', uploadError);
          toast.warning('Logo upload failed, saving restaurant without logo');
        }
      }

      const restaurantData = {
        // Basic Info
        name: formData.name,
        description: formData.description,
        cuisine: formData.cuisine,
        tags: formData.tags,
        
        // Contact Info
        ownerEmail: formData.ownerEmail,
        contact: formData.contact,
        ownerPhone: formData.ownerPhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        
        // Business Hours
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        workingDays: formData.workingDays,
        
        // Service Settings
        deliveryAvailable: formData.deliveryAvailable,
        takeawayAvailable: formData.takeawayAvailable,
        dineInAvailable: formData.dineInAvailable,
        currentlyAcceptingOrders: formData.currentlyAcceptingOrders,
        deliveryRadius: parseFloat(formData.deliveryRadius) || 5,
        deliveryFee: parseFloat(formData.deliveryFee) || 0,
        packagingFee: parseFloat(formData.packagingFee) || 0,
        
        // Status & Ratings
        status: formData.status,
        isActive: formData.isActive,
        featured: formData.featured,
        rating: parseFloat(formData.rating) || 4.0,
        totalRatings: parseInt(formData.totalRatings) || 0,
        preparationTime: formData.preparationTime,
        
        // Media
        logo: logoURL,
        
        // Financial
        commissionRate: parseFloat(formData.commissionRate) || 15,
        taxRate: parseFloat(formData.taxRate) || 5,
        
        // Verification
        verified: formData.verified,
        
        updatedAt: new Date().toISOString(),
      };

      if (editingRestaurant) {
        await restaurantService.updateRestaurant(editingRestaurant.id, restaurantData);
        toast.success('Restaurant updated successfully');
      } else {
        restaurantData.createdAt = new Date().toISOString();
        
        // Try using restaurantService first, fallback to direct Firestore
        try {
          await restaurantService.addRestaurant(restaurantData);
        } catch (serviceError) {
          console.warn('Restaurant service failed, using direct Firestore:', serviceError);
          // Fallback to direct Firestore
          const docRef = await addDoc(collection(db, 'restaurants'), restaurantData);
          console.log('Restaurant added with ID: ', docRef.id);
        }
        
        toast.success('Restaurant added successfully');
      }

      handleCloseDialog();
      fetchRestaurants();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast.error(`Error saving restaurant: ${error.message}`);
    }

    setLoading(false);
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageURL = editingMenuItem?.imageUrl || '';

      // Upload new image if provided
      if (menuFormData.imageFile) {
        try {
          const imageRef = ref(storage, `menuItems/${Date.now()}_${menuFormData.imageFile.name}`);
          const snapshot = await uploadBytes(imageRef, menuFormData.imageFile);
          imageURL = await getDownloadURL(snapshot.ref);
          toast.success('Menu item image uploaded successfully');
        } catch (uploadError) {
          console.error('Menu image upload failed:', uploadError);
          toast.warning('Menu image upload failed, saving without image');
        }
      }

      const menuData = {
        name: menuFormData.name,
        category: menuFormData.category,
        price: parseFloat(menuFormData.price) || 0,
        description: menuFormData.description,
        available: menuFormData.available,
        image: menuFormData.image,
        imageUrl: imageURL,
        restaurantId: selectedRestaurant.id,
        updatedAt: new Date().toISOString(),
      };

      if (editingMenuItem) {
        await updateDoc(doc(db, 'menuItems', editingMenuItem.id), menuData);
        toast.success('Menu item updated successfully');
      } else {
        menuData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'menuItems'), menuData);
        toast.success('Menu item added successfully');
      }

      handleCloseMenuDialog();
      fetchMenuItems(selectedRestaurant.id);
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error(`Error saving menu item: ${error.message}`);
    }

    setLoading(false);
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    if (window.confirm('Are you sure you want to delete this restaurant? All menu items will also be deleted.')) {
      try {
        await restaurantService.deleteRestaurant(restaurantId);
        toast.success('Restaurant deleted successfully');
        fetchRestaurants();
      } catch (error) {
        toast.error('Error deleting restaurant');
        console.error('Error:', error);
      }
    }
    setAnchorEl(null);
  };

  const handleDeleteMenuItem = async (menuItemId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await deleteDoc(doc(db, 'menuItems', menuItemId));
        toast.success('Menu item deleted successfully');
        fetchMenuItems(selectedRestaurant.id);
      } catch (error) {
        toast.error('Error deleting menu item');
        console.error('Error:', error);
      }
    }
    setMenuAnchorEl(null);
  };

  const handleMenuOpen = (event, restaurant) => {
    setAnchorEl(event.currentTarget);
    setSelectedRestaurant(restaurant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemMenuOpen = (event, menuItem) => {
    setMenuAnchorEl(event.currentTarget);
    setEditingMenuItem(menuItem);
  };

  const handleMenuItemMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const toggleRestaurantStatus = async (restaurant) => {
    try {
      await restaurantService.updateRestaurant(restaurant.id, {
        isActive: !restaurant.isActive
      });
      toast.success(`Restaurant ${!restaurant.isActive ? 'activated' : 'deactivated'}`);
      fetchRestaurants();
    } catch (error) {
      toast.error('Error updating restaurant status');
    }
  };

  const toggleMenuItemStatus = async (menuItem) => {
    try {
      await updateDoc(doc(db, 'menuItems', menuItem.id), {
        available: !menuItem.available,
        updatedAt: new Date().toISOString(),
      });
      toast.success(`Menu item ${!menuItem.available ? 'enabled' : 'disabled'}`);
      fetchMenuItems(selectedRestaurant.id);
    } catch (error) {
      toast.error('Error updating menu item status');
    }
  };

  const viewRestaurantMenus = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setViewingMenus(true);
    handleMenuClose();
  };

  const backToRestaurants = () => {
    setViewingMenus(false);
    setSelectedRestaurant(null);
    setMenuItems([]);
  };

  const getFilteredEmojis = () => {
    if (!unicodeSearch.trim()) {
      return FOOD_EMOJIS;
    }
    
    const searchLower = unicodeSearch.toLowerCase();
    return FOOD_EMOJIS.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.keywords.toLowerCase().includes(searchLower)
    );
  };

  const filteredEmojis = getFilteredEmojis();

  // Enhanced restaurant columns with more info
  const restaurantColumns = [
    { 
      field: 'logo', 
      headerName: 'Logo', 
      width: 80,
      renderCell: (params) => (
        <Badge
          color={params.row.featured ? "secondary" : "default"}
          badgeContent={params.row.featured ? "★" : ""}
        >
          {params.value ? (
            <Avatar src={params.value} sx={{ width: 40, height: 40 }} />
          ) : (
            <Avatar sx={{ width: 40, height: 40 }}>
              <RestaurantIcon />
            </Avatar>
          )}
        </Badge>
      ),
    },
    { field: 'name', headerName: 'Name', width: 200 },
    { 
      field: 'cuisine', 
      headerName: 'Cuisine', 
      width: 150,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    { 
      field: 'rating', 
      headerName: 'Rating', 
      width: 120,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <StarIcon sx={{ color: '#ffb400', fontSize: 18, mr: 0.5 }} />
          <Typography variant="body2">
            {params.value} ({params.row.totalRatings || 0})
          </Typography>
        </Box>
      ),
    },
    { 
      field: 'currentlyAcceptingOrders', 
      headerName: 'Accepting Orders', 
      width: 140,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'deliveryAvailable',
      headerName: 'Delivery',
      width: 100,
      renderCell: (params) => (
        <Tooltip title={params.value ? 'Delivery Available' : 'Delivery Not Available'}>
          {params.value ? <DeliveryIcon color="success" /> : <DeliveryIcon color="disabled" />}
        </Tooltip>
      ),
    },
    {
      field: 'takeawayAvailable',
      headerName: 'Takeaway',
      width: 100,
      renderCell: (params) => (
        <Tooltip title={params.value ? 'Takeaway Available' : 'Takeaway Not Available'}>
          {params.value ? <TakeoutIcon color="success" /> : <TakeoutIcon color="disabled" />}
        </Tooltip>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => handleMenuOpen(e, params.row)}
          size="small"
        >
          <MoreIcon />
        </IconButton>
      ),
    },
  ];

  const menuItemColumns = [
    { 
      field: 'imageUrl', 
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
          <Typography variant="h4">{params.row.image || '🍽️'}</Typography>
        )
      ),
    },
    { field: 'name', headerName: 'Item Name', width: 200 },
    { field: 'category', headerName: 'Category', width: 150 },
    { 
      field: 'price', 
      headerName: 'Price', 
      width: 120,
      renderCell: (params) => `₹${params.value?.toFixed(2)}`,
    },
    { 
      field: 'description', 
      headerName: 'Description', 
      width: 250,
      flex: 1 
    },
    {
      field: 'available',
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
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => handleMenuItemMenuOpen(e, params.row)}
          size="small"
        >
          <MoreIcon />
        </IconButton>
      ),
    },
  ];

  if (viewingMenus && selectedRestaurant) {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={backToRestaurants} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box flex={1}>
            <Typography variant="h4">
              {selectedRestaurant.name} - Menu Items
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {selectedRestaurant.address}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenMenuDialog()}
          >
            Add Menu Item
          </Button>
        </Box>

        <Card>
          <CardContent>
            <DataGrid
              rows={menuItems}
              columns={menuItemColumns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              autoHeight
              disableSelectionOnClick
            />
          </CardContent>
        </Card>

        {/* Menu Item Dialog */}
        <Dialog open={openMenuDialog} onClose={handleCloseMenuDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </DialogTitle>
          <form onSubmit={handleMenuSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
                    {menuFormData.imagePreview ? (
                      <Box position="relative">
                        <img 
                          src={menuFormData.imagePreview} 
                          alt="Menu item preview"
                          style={{ 
                            width: 120, 
                            height: 120, 
                            objectFit: 'cover', 
                            borderRadius: 8,
                            border: '2px solid #e0e0e0'
                          }}
                        />
                        <Box
                          position="absolute"
                          bottom={-10}
                          right={-10}
                          sx={{
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            padding: '4px',
                            boxShadow: 2
                          }}
                        >
                          <Typography variant="h3">{menuFormData.image || '🍽️'}</Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="h1">{menuFormData.image || '🍽️'}</Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <input
                    accept="image/*"
                    type="file"
                    onChange={handleMenuImageChange}
                    style={{ display: 'none' }}
                    id="menu-image-upload"
                  />
                  <label htmlFor="menu-image-upload">
                    <Button 
                      variant="outlined" 
                      component="span" 
                      fullWidth
                      color={menuFormData.imagePreview ? "success" : "primary"}
                    >
                      {menuFormData.imagePreview ? '✓ Image Uploaded (Optional)' : 'Upload Image (Optional)'}
                    </Button>
                  </label>
                  {menuFormData.imageFile && (
                    <Typography variant="caption" color="textSecondary" sx={{ ml: 1, display: 'block', mt: 1 }}>
                      {menuFormData.imageFile.name}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Select Food Icon</InputLabel>
                    <Select
                      name="image"
                      value={menuFormData.image}
                      onChange={handleMenuInputChange}
                      label="Select Food Icon"
                      MenuProps={{
                        PaperProps: { style: { maxHeight: 450 } },
                        autoFocus: false,
                      }}
                      renderValue={(selected) => {
                        const selectedItem = FOOD_EMOJIS.find(item => item.unicode === selected);
                        return (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="h6">{selected}</Typography>
                            <Typography>{selectedItem?.name || 'Select an icon'}</Typography>
                          </Box>
                        );
                      }}
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
                          placeholder="🔍 Search food items (e.g., biryani, dosa, burger)..."
                          value={unicodeSearch}
                          onChange={(e) => setUnicodeSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus={false}
                          InputProps={{
                            sx: { backgroundColor: '#f5f5f5' }
                          }}
                        />
                      </Box>
                      {filteredEmojis.length === 0 ? (
                        <MenuItem disabled>
                          <Typography color="textSecondary">No items found</Typography>
                        </MenuItem>
                      ) : (
                        filteredEmojis.map((item, index) => (
                          <MenuItem key={index} value={item.unicode}>
                            <Box display="flex" alignItems="center" gap={2} width="100%">
                              <Typography variant="h5">{item.unicode}</Typography>
                              <Box>
                                <Typography fontWeight="medium">{item.name}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {item.keywords.split(' ').slice(0, 4).join(', ')}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Item Name"
                    name="name"
                    value={menuFormData.name}
                    onChange={handleMenuInputChange}
                    required
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={menuFormData.category}
                      onChange={handleMenuInputChange}
                      label="Category"
                    >
                      {menuCategories.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Price (₹)"
                    name="price"
                    type="number"
                    value={menuFormData.price}
                    onChange={handleMenuInputChange}
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
                    value={menuFormData.description}
                    onChange={handleMenuInputChange}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="available"
                        checked={menuFormData.available}
                        onChange={handleMenuInputChange}
                      />
                    }
                    label="Available"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseMenuDialog}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Saving...' : editingMenuItem ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Menu Item Action Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuItemMenuClose}
        >
          <MenuItem
            onClick={() => {
              handleOpenMenuDialog(editingMenuItem);
              handleMenuItemMenuClose();
            }}
          >
            <EditIcon sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              toggleMenuItemStatus(editingMenuItem);
              handleMenuItemMenuClose();
            }}
          >
            <Switch 
              size="small" 
              checked={editingMenuItem?.available} 
              sx={{ mr: 1 }} 
            />
            {editingMenuItem?.available ? 'Mark Unavailable' : 'Mark Available'}
          </MenuItem>
          <MenuItem
            onClick={() => handleDeleteMenuItem(editingMenuItem.id)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">
            Restaurants Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage restaurants, menus, and delivery settings
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Restaurant
        </Button>
      </Box>

      <Card>
        <CardContent>
          <DataGrid
            rows={restaurants}
            columns={restaurantColumns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            autoHeight
            disableSelectionOnClick
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Enhanced Restaurant Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">
              {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
            </Typography>
            <Box>
              <Chip 
                label={formData.verified ? "Verified" : "Unverified"} 
                color={formData.verified ? "success" : "default"}
                size="small"
              />
              <Chip 
                label={formData.featured ? "Featured" : "Regular"} 
                color={formData.featured ? "secondary" : "default"}
                size="small"
                sx={{ ml: 1 }}
              />
            </Box>
          </Box>
        </DialogTitle>
        
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Basic Info" />
          <Tab label="Contact & Location" />
          <Tab label="Business Hours" />
          <Tab label="Services & Delivery" />
          <Tab label="Financial" />
        </Tabs>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
                  <Box position="relative">
                    <Avatar 
                      src={formData.logoPreview} 
                      sx={{ width: 120, height: 120 }}
                      variant="rounded"
                    >
                      <RestaurantIcon fontSize="large" />
                    </Avatar>
                    <IconButton 
                      sx={{ 
                        position: 'absolute', 
                        bottom: -8, 
                        right: -8,
                        backgroundColor: 'white',
                        boxShadow: 2
                      }}
                      component="label"
                    >
                      <UploadIcon />
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => handleFileChange('logo', e.target.files[0])}
                      />
                    </IconButton>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Restaurant Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Cuisine Type *</InputLabel>
                    <Select
                      name="cuisine"
                      value={formData.cuisine}
                      onChange={handleInputChange}
                      label="Cuisine Type *"
                    >
                      {cuisineTypes.map((cuisine) => (
                        <MenuItem key={cuisine} value={cuisine}>{cuisine}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                    placeholder="Describe your restaurant, specialties, etc."
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Restaurant Tags</InputLabel>
                    <Select
                      multiple
                      name="tags"
                      value={formData.tags}
                      onChange={(e) => handleArrayInputChange('tags', e.target.value)}
                      onClose={(e) => e.stopPropagation()}
                      label="Restaurant Tags"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                          },
                        },
                      }}
                    >
                      {restaurantTags.map((tag) => (
                        <MenuItem key={tag} value={tag}>
                          {tag}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Preparation Time *"
                    name="preparationTime"
                    value={formData.preparationTime}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 25-30 min"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Rating"
                    name="rating"
                    type="number"
                    value={formData.rating}
                    onChange={handleInputChange}
                    inputProps={{ step: '0.1', min: '0', max: '5' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <StarIcon sx={{ color: '#ffb400' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                      />
                    }
                    label="Featured Restaurant"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="verified"
                        checked={formData.verified}
                        onChange={handleInputChange}
                      />
                    }
                    label="Verified Restaurant"
                  />
                </Grid>
              </Grid>
            )}

            {activeTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Owner Email *"
                    name="ownerEmail"
                    type="email"
                    value={formData.ownerEmail}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Restaurant Contact *"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Owner Phone *"
                    name="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City *"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State *"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Pincode *"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Address *"
                    name="address"
                    multiline
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Opening Time *</InputLabel>
                    <Select
                      name="openingTime"
                      value={formData.openingTime}
                      onChange={handleInputChange}
                      label="Opening Time *"
                      startAdornment={
                        <InputAdornment position="start">
                          <ScheduleIcon color="action" />
                        </InputAdornment>
                      }
                    >
                      {timeSlots.map((time) => (
                        <MenuItem key={time} value={time}>{time}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Closing Time *</InputLabel>
                    <Select
                      name="closingTime"
                      value={formData.closingTime}
                      onChange={handleInputChange}
                      label="Closing Time *"
                      startAdornment={
                        <InputAdornment position="start">
                          <ScheduleIcon color="action" />
                        </InputAdornment>
                      }
                    >
                      {timeSlots.map((time) => (
                        <MenuItem key={time} value={time}>{time}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Working Days
                  </Typography>
                  <FormGroup row>
                    {daysOfWeek.map((day) => (
                      <FormControlLabel
                        key={day.id}
                        control={
                          <Switch
                            checked={formData.workingDays.includes(day.id)}
                            onChange={(e) => {
                              const newWorkingDays = e.target.checked
                                ? [...formData.workingDays, day.id]
                                : formData.workingDays.filter(d => d !== day.id);
                              handleArrayInputChange('workingDays', newWorkingDays);
                            }}
                            size="small"
                          />
                        }
                        label={day.name}
                      />
                    ))}
                  </FormGroup>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info">
                    Make sure to set proper working hours and days. Orders won't be accepted outside these hours.
                  </Alert>
                </Grid>
              </Grid>
            )}

            {activeTab === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Service Availability
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            name="deliveryAvailable"
                            checked={formData.deliveryAvailable}
                            onChange={handleInputChange}
                          />
                        }
                        label="Delivery"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            name="takeawayAvailable"
                            checked={formData.takeawayAvailable}
                            onChange={handleInputChange}
                          />
                        }
                        label="Takeaway"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            name="dineInAvailable"
                            checked={formData.dineInAvailable}
                            onChange={handleInputChange}
                          />
                        }
                        label="Dine-in"
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="currentlyAcceptingOrders"
                        checked={formData.currentlyAcceptingOrders}
                        onChange={handleInputChange}
                      />
                    }
                    label="Currently Accepting Orders"
                  />
                  {!formData.currentlyAcceptingOrders && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      Restaurant is not accepting orders currently
                    </Alert>
                  )}
                </Grid>
{/* 
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Delivery Radius (km) *"
                    name="deliveryRadius"
                    type="number"
                    value={formData.deliveryRadius}
                    onChange={handleInputChange}
                    required
                  />
                </Grid> */}

                {/* <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Delivery Fee (₹)"
                    name="deliveryFee"
                    type="number"
                    value={formData.deliveryFee}
                    onChange={handleInputChange}
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid> */}

                {/* <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Packaging Fee (₹)"
                    name="packagingFee"
                    type="number"
                    value={formData.packagingFee}
                    onChange={handleInputChange}
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid> */}
              </Grid>
            )}

            {activeTab === 4 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Commission Rate (%)"
                    name="commissionRate"
                    type="number"
                    value={formData.commissionRate}
                    onChange={handleInputChange}
                    inputProps={{ step: '0.1', min: '0', max: '50' }}
                    helperText="Platform commission percentage"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tax Rate (%)"
                    name="taxRate"
                    type="number"
                    value={formData.taxRate}
                    onChange={handleInputChange}
                    inputProps={{ step: '0.1', min: '0', max: '30' }}
                    helperText="GST/tax percentage"
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" width="100%">
              <Box>
                {activeTab > 0 && (
                  <Button onClick={() => setActiveTab(activeTab - 1)}>
                    Previous
                  </Button>
                )}
              </Box>
              <Box>
                {activeTab < 4 && (
                  <Button onClick={() => setActiveTab(activeTab + 1)} variant="outlined" sx={{ mr: 1 }}>
                    Next
                  </Button>
                )}
                <Button onClick={handleCloseDialog}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={loading} sx={{ ml: 1 }}>
                  {loading ? 'Saving...' : editingRestaurant ? 'Update' : 'Add'} Restaurant
                </Button>
              </Box>
            </Box>
          </DialogActions>
        </form>
      </Dialog>

      {/* Restaurant Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => viewRestaurantMenus(selectedRestaurant)}
        >
          <MenuBookIcon sx={{ mr: 1 }} />
          Manage Menu Items
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleOpenDialog(selectedRestaurant);
            handleMenuClose();
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Edit Restaurant
        </MenuItem>
        <MenuItem
          onClick={() => {
            toggleRestaurantStatus(selectedRestaurant);
            handleMenuClose();
          }}
        >
          <Switch 
            size="small" 
            checked={selectedRestaurant?.isActive} 
            sx={{ mr: 1 }} 
          />
          {selectedRestaurant?.isActive ? 'Deactivate' : 'Activate'}
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteRestaurant(selectedRestaurant.id)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Restaurants;