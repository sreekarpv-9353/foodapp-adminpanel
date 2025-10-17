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
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
  MenuBook as MenuBookIcon,
  ArrowBack as ArrowBackIcon,
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

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    ownerEmail: '',
    contact: '',
    ownerPhone: '',
    cuisine: '',
    deliveryTime: '',
    rating: '',
    image: '🍽️',
    status: 'active',
    isActive: true,
    logo: null,
    logoPreview: '',
  });

  const [menuFormData, setMenuFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    available: true,
    image: '',
    imageFile: null,
    imagePreview: '',
  });

  // Menu categories
  const menuCategories = [
    'Appetizers',
    'Main Course',
    'Biryani',
    'Breads',
    'Rice',
    'Chinese',
    'South Indian',
    'Desserts',
    'Beverages',
    'Snacks'
  ];

  const FOOD_EMOJIS = [
  // South Indian
  { name: 'Idli', unicode: '⚪', keywords: 'idli south indian breakfast steamed' },
  { name: 'Dosa', unicode: '🫓', keywords: 'dosa south indian crispy crepe' },
  { name: 'Masala Dosa', unicode: '🥙', keywords: 'masala dosa south indian' },
  { name: 'Vada', unicode: '🍩', keywords: 'vada medu vada south indian' },
  { name: 'Uttapam', unicode: '🥞', keywords: 'uttapam south indian pancake' },
  { name: 'Upma', unicode: '🍚', keywords: 'upma south indian breakfast' },
  { name: 'Pongal', unicode: '🥘', keywords: 'pongal south indian rice' },
  { name: 'Sambar', unicode: '🥣', keywords: 'sambar south indian lentil curry' },
  { name: 'Rasam', unicode: '🍵', keywords: 'rasam south indian soup' },
  { name: 'Idiyappam', unicode: '🍜', keywords: 'idiyappam string hoppers south indian' },
  { name: 'Appam', unicode: '🫔', keywords: 'appam kerala south indian' },
  { name: 'Puttu', unicode: '🧊', keywords: 'puttu kerala south indian' },
  { name: 'Bisi Bele Bath', unicode: '🍲', keywords: 'bisi bele bath karnataka rice' },
  { name: 'Lemon Rice', unicode: '🍋', keywords: 'lemon rice south indian' },
  { name: 'Curd Rice', unicode: '🥛', keywords: 'curd rice thayir sadam south indian' },
  { name: 'Coconut Chutney', unicode: '🥥', keywords: 'coconut chutney south indian' },
  { name: 'Payasam', unicode: '🍮', keywords: 'payasam kheer south indian dessert' },
  
  // North Indian Curries
  { name: 'Butter Chicken', unicode: '🍗', keywords: 'butter chicken murgh makhani curry' },
  { name: 'Chicken Curry', unicode: '🍛', keywords: 'chicken curry gravy' },
  { name: 'Mutton Curry', unicode: '🍖', keywords: 'mutton curry lamb goat' },
  { name: 'Paneer Butter Masala', unicode: '🧀', keywords: 'paneer butter masala curry' },
  { name: 'Dal Makhani', unicode: '🫘', keywords: 'dal makhani black lentils curry' },
  { name: 'Dal Tadka', unicode: '🥄', keywords: 'dal tadka yellow lentils' },
  { name: 'Rajma', unicode: '🫛', keywords: 'rajma kidney beans curry' },
  { name: 'Chole', unicode: '🟡', keywords: 'chole chickpeas chana masala' },
  { name: 'Kadai Paneer', unicode: '🥘', keywords: 'kadai paneer curry' },
  { name: 'Palak Paneer', unicode: '🥬', keywords: 'palak paneer spinach curry' },
  { name: 'Paneer Tikka Masala', unicode: '🟠', keywords: 'paneer tikka masala' },
  { name: 'Shahi Paneer', unicode: '🟨', keywords: 'shahi paneer royal curry' },
  { name: 'Malai Kofta', unicode: '⚪', keywords: 'malai kofta curry dumplings' },
  { name: 'Korma', unicode: '🥣', keywords: 'korma curry creamy' },
  { name: 'Rogan Josh', unicode: '🔴', keywords: 'rogan josh kashmiri curry' },
  
  // Biryani & Rice
  { name: 'Biryani', unicode: '🍱', keywords: 'biryani rice hyderabadi' },
  { name: 'Chicken Biryani', unicode: '🍛', keywords: 'chicken biryani rice' },
  { name: 'Mutton Biryani', unicode: '🥙', keywords: 'mutton biryani rice' },
  { name: 'Veg Biryani', unicode: '🍲', keywords: 'veg biryani vegetarian rice' },
  { name: 'Dum Biryani', unicode: '🫕', keywords: 'dum biryani slow cooked' },
  { name: 'Pulao', unicode: '🍚', keywords: 'pulao pilaf rice' },
  { name: 'Jeera Rice', unicode: '🌾', keywords: 'jeera rice cumin' },
  { name: 'Fried Rice', unicode: '🥡', keywords: 'fried rice chinese' },
  
  // Breads
  { name: 'Naan', unicode: '🫓', keywords: 'naan bread tandoor' },
  { name: 'Roti', unicode: '🥖', keywords: 'roti chapati bread' },
  { name: 'Paratha', unicode: '🥞', keywords: 'paratha layered bread' },
  { name: 'Kulcha', unicode: '🥐', keywords: 'kulcha stuffed naan' },
  { name: 'Butter Naan', unicode: '🧈', keywords: 'butter naan bread' },
  { name: 'Garlic Naan', unicode: '🧄', keywords: 'garlic naan bread' },
  { name: 'Puri', unicode: '🫔', keywords: 'puri poori fried bread' },
  { name: 'Bhatura', unicode: '🥯', keywords: 'bhatura chole bhature bread' },
  { name: 'Roomali Roti', unicode: '📜', keywords: 'roomali roti thin bread' },
  
  // Starters/Appetizers
  { name: 'Samosa', unicode: '🥟', keywords: 'samosa starter snack fried' },
  { name: 'Pakora', unicode: '🧆', keywords: 'pakora bhaji fritters' },
  { name: 'Spring Roll', unicode: '🌯', keywords: 'spring roll chinese starter' },
  { name: 'Paneer Tikka', unicode: '🍢', keywords: 'paneer tikka tandoor starter' },
  { name: 'Chicken Tikka', unicode: '🍡', keywords: 'chicken tikka tandoor starter' },
  { name: 'Kebab', unicode: ' 串', keywords: 'kebab seekh starter' },
  { name: 'Tandoori Chicken', unicode: '🍗', keywords: 'tandoori chicken starter' },
  { name: 'Chicken Wings', unicode: '🍖', keywords: 'chicken wings starter' },
  { name: 'Fish Fry', unicode: '🐟', keywords: 'fish fry starter' },
  { name: 'Prawn Fry', unicode: '🦐', keywords: 'prawn shrimp fry starter' },
  { name: 'Chicken 65', unicode: '🔥', keywords: 'chicken 65 starter spicy' },
  { name: 'Gobi 65', unicode: '🥦', keywords: 'gobi 65 cauliflower starter' },
  { name: 'Paneer 65', unicode: '🟧', keywords: 'paneer 65 starter' },
  { name: 'Cutlet', unicode: '🥙', keywords: 'cutlet veg potato starter' },
  { name: 'Aloo Tikki', unicode: '🥔', keywords: 'aloo tikki potato starter' },
  { name: 'Onion Rings', unicode: '🧅', keywords: 'onion rings fried starter' },
  { name: 'French Fries', unicode: '🍟', keywords: 'french fries potato' },
  { name: 'Nachos', unicode: '🌮', keywords: 'nachos chips starter' },
  { name: 'Garlic Bread', unicode: '🥖', keywords: 'garlic bread starter' },
  
  // Chinese
  { name: 'Noodles', unicode: '🍝', keywords: 'noodles hakka chinese' },
  { name: 'Chow Mein', unicode: '🥢', keywords: 'chow mein noodles chinese' },
  { name: 'Manchurian', unicode: '🥘', keywords: 'manchurian chinese gravy' },
  { name: 'Schezwan Fried Rice', unicode: '🍚', keywords: 'fried rice chinese schezwan' },
  { name: 'Momos', unicode: '🥟', keywords: 'momos dumplings chinese tibetan' },
  { name: 'Chilli Chicken', unicode: '🌶️', keywords: 'chilli chicken chinese spicy' },
  { name: 'Chilli Paneer', unicode: '🌶️', keywords: 'chilli paneer chinese' },
  { name: 'Sweet & Sour', unicode: '🍲', keywords: 'sweet sour chinese' },
  { name: 'Schezwan Sauce', unicode: '🔴', keywords: 'schezwan spicy chinese' },
  { name: 'Hot & Sour Soup', unicode: '🥣', keywords: 'soup hot sour chinese' },
  { name: 'Hakka Noodles', unicode: '🍜', keywords: 'hakka noodles chinese' },
  
  // American/Continental
  { name: 'Burger', unicode: '🍔', keywords: 'burger american fast food' },
  { name: 'Pizza', unicode: '🍕', keywords: 'pizza italian cheese' },
  { name: 'Sandwich', unicode: '🥪', keywords: 'sandwich bread' },
  { name: 'Hot Dog', unicode: '🌭', keywords: 'hot dog american' },
  { name: 'Pasta', unicode: '🍝', keywords: 'pasta italian spaghetti' },
  { name: 'Mac & Cheese', unicode: '🧀', keywords: 'mac cheese macaroni pasta' },
  { name: 'Steak', unicode: '🥩', keywords: 'steak beef meat' },
  { name: 'Grilled Chicken', unicode: '🍗', keywords: 'grilled chicken' },
  { name: 'Wrap', unicode: '🌯', keywords: 'wrap roll sandwich' },
  { name: 'Taco', unicode: '🌮', keywords: 'taco mexican' },
  { name: 'Burrito', unicode: '🌯', keywords: 'burrito mexican wrap' },
  { name: 'Quesadilla', unicode: '🫔', keywords: 'quesadilla mexican' },
  { name: 'Sushi', unicode: '🍣', keywords: 'sushi japanese' },
  { name: 'Ramen', unicode: '🍜', keywords: 'ramen japanese noodles' },
  
  // Snacks
  { name: 'Pav Bhaji', unicode: '🍞', keywords: 'pav bhaji mumbai street food' },
  { name: 'Vada Pav', unicode: '🥙', keywords: 'vada pav mumbai burger' },
  { name: 'Pani Puri', unicode: '💧', keywords: 'pani puri golgappa street food' },
  { name: 'Bhel Puri', unicode: '🥗', keywords: 'bhel puri chaat street food' },
  { name: 'Sev Puri', unicode: '🫒', keywords: 'sev puri chaat street food' },
  { name: 'Dahi Puri', unicode: '🥛', keywords: 'dahi puri chaat street food' },
  { name: 'Chaat', unicode: '🍲', keywords: 'chaat street food snack' },
  { name: 'Kachori', unicode: '🟤', keywords: 'kachori fried snack' },
  { name: 'Popcorn', unicode: '🍿', keywords: 'popcorn snack' },
  { name: 'Chips', unicode: '🥔', keywords: 'chips potato snack' },
  
  // Desserts
  { name: 'Ice Cream', unicode: '🍨', keywords: 'ice cream dessert' },
  { name: 'Gulab Jamun', unicode: '🍡', keywords: 'gulab jamun sweet dessert' },
  { name: 'Rasgulla', unicode: '⚪', keywords: 'rasgulla sweet dessert' },
  { name: 'Jalebi', unicode: '🟠', keywords: 'jalebi sweet dessert' },
  { name: 'Kheer', unicode: '🥛', keywords: 'kheer payasam rice pudding' },
  { name: 'Halwa', unicode: '🟫', keywords: 'halwa sweet dessert' },
  { name: 'Ladoo', unicode: '🟡', keywords: 'ladoo sweet dessert' },
  { name: 'Barfi', unicode: '🟨', keywords: 'barfi sweet dessert' },
  { name: 'Kulfi', unicode: '🍦', keywords: 'kulfi indian ice cream' },
  { name: 'Cake', unicode: '🍰', keywords: 'cake dessert pastry' },
  { name: 'Pastry', unicode: '🥐', keywords: 'pastry dessert bakery' },
  { name: 'Brownie', unicode: '🍫', keywords: 'brownie chocolate dessert' },
  { name: 'Cookie', unicode: '🍪', keywords: 'cookie biscuit dessert' },
  { name: 'Donut', unicode: '🍩', keywords: 'donut doughnut dessert' },
  { name: 'Cupcake', unicode: '🧁', keywords: 'cupcake muffin dessert' },
  { name: 'Pudding', unicode: '🍮', keywords: 'pudding dessert' },
  { name: 'Cheesecake', unicode: '🎂', keywords: 'cheesecake dessert' },
  
  // Beverages
  { name: 'Tea', unicode: '🍵', keywords: 'tea chai hot beverage' },
  { name: 'Coffee', unicode: '☕', keywords: 'coffee hot beverage' },
  { name: 'Masala Chai', unicode: '🫖', keywords: 'masala chai tea indian' },
  { name: 'Filter Coffee', unicode: '☕', keywords: 'filter coffee south indian' },
  { name: 'Lassi', unicode: '🥤', keywords: 'lassi yogurt drink punjabi' },
  { name: 'Buttermilk', unicode: '🥛', keywords: 'buttermilk chaas drink' },
  { name: 'Milkshake', unicode: '🥤', keywords: 'milkshake shake beverage' },
  { name: 'Smoothie', unicode: '🧋', keywords: 'smoothie fruit drink' },
  { name: 'Fresh Juice', unicode: '🧃', keywords: 'juice fresh fruit' },
  { name: 'Soft Drink', unicode: '🥤', keywords: 'soft drink soda cola' },
  { name: 'Mojito', unicode: '🍹', keywords: 'mojito mocktail drink' },
  { name: 'Lemonade', unicode: '🍋', keywords: 'lemonade nimbu pani drink' },
  { name: 'Coconut Water', unicode: '🥥', keywords: 'coconut water drink' },
  { name: 'Sugarcane Juice', unicode: '🧃', keywords: 'sugarcane juice drink' },
  { name: 'Beer', unicode: '🍺', keywords: 'beer alcohol beverage' },
  { name: 'Wine', unicode: '🍷', keywords: 'wine alcohol beverage' },
  { name: 'Cocktail', unicode: '🍸', keywords: 'cocktail drink alcohol' },
  
  // Seafood
  { name: 'Fish Curry', unicode: '🐟', keywords: 'fish curry seafood' },
  { name: 'Prawn Curry', unicode: '🦐', keywords: 'prawn shrimp curry seafood' },
  { name: 'Crab', unicode: '🦀', keywords: 'crab seafood' },
  { name: 'Lobster', unicode: '🦞', keywords: 'lobster seafood' },
  { name: 'Fish Fillet', unicode: '🐠', keywords: 'fish fillet grilled' },
  
  // Salads
  { name: 'Green Salad', unicode: '🥗', keywords: 'green salad vegetables healthy' },
  { name: 'Caesar Salad', unicode: '🥙', keywords: 'caesar salad' },
  { name: 'Fruit Salad', unicode: '🍇', keywords: 'fruit salad fresh' },
  { name: 'Raita', unicode: '🥣', keywords: 'raita yogurt side dish' },
  
  // Eggs
  { name: 'Omelette', unicode: '🍳', keywords: 'omelette egg breakfast' },
  { name: 'Boiled Egg', unicode: '🥚', keywords: 'boiled egg' },
  { name: 'Fried Egg', unicode: '🍳', keywords: 'fried egg sunny side' },
  { name: 'Egg Curry', unicode: '🥚', keywords: 'egg curry gravy' },
  { name: 'Scrambled Eggs', unicode: '🍳', keywords: 'scrambled eggs breakfast' },
  
  // Misc
  { name: 'Thali', unicode: '🍱', keywords: 'thali complete meal indian' },
  { name: 'Bowl', unicode: '🥣', keywords: 'bowl soup dal' },
  { name: 'Plate', unicode: '🍽️', keywords: 'plate dish meal' },
];

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenuItems(selectedRestaurant.id);
    }
  }, [selectedRestaurant]);

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
        name: restaurant.name || '',
        address: restaurant.address || '',
        ownerEmail: restaurant.ownerEmail || '',
        contact: restaurant.contact || '',
        ownerPhone: restaurant.ownerPhone || '',
        cuisine: restaurant.cuisine || '',
        deliveryTime: restaurant.deliveryTime || '',
        rating: restaurant.rating || '',
        image: restaurant.image || '🍽️',
        status: restaurant.status || 'active',
        isActive: restaurant.isActive !== undefined ? restaurant.isActive : true,
        logo: null,
        logoPreview: restaurant.logo || '',
      });
    } else {
      setEditingRestaurant(null);
      setFormData({
        name: '',
        address: '',
        ownerEmail: '',
        contact: '',
        ownerPhone: '',
        cuisine: '',
        deliveryTime: '',
        rating: '4.0',
        image: '🍽️',
        status: 'active',
        isActive: true,
        logo: null,
        logoPreview: '',
      });
    }
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        logo: file,
        logoPreview: URL.createObjectURL(file),
      }));
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    
    try {
      const storageRef = ref(storage, `restaurants/${Date.now()}_${file.name}`);
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

      if (formData.logo) {
        logoURL = await uploadImage(formData.logo);
      }

      const restaurantData = {
        name: formData.name,
        address: formData.address,
        ownerEmail: formData.ownerEmail,
        contact: formData.contact,
        ownerPhone: formData.ownerPhone,
        cuisine: formData.cuisine,
        deliveryTime: formData.deliveryTime,
        rating: parseFloat(formData.rating) || 4.0,
        image: formData.image,
        status: formData.status,
        isActive: formData.isActive,
        logo: logoURL,
        updatedAt: new Date().toISOString(),
      };

      if (editingRestaurant) {
        await restaurantService.updateRestaurant(editingRestaurant.id, restaurantData);
        toast.success('Restaurant updated successfully');
      } else {
        restaurantData.createdAt = new Date().toISOString();
        await restaurantService.addRestaurant(restaurantData);
        toast.success('Restaurant added successfully');
      }

      handleCloseDialog();
      fetchRestaurants();
    } catch (error) {
      toast.error('Error saving restaurant');
      console.error('Error:', error);
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
        const imageRef = ref(storage, `menuItems/${Date.now()}_${menuFormData.imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, menuFormData.imageFile);
        imageURL = await getDownloadURL(snapshot.ref);
      }

      const menuData = {
        name: menuFormData.name,
        category: menuFormData.category,
        price: parseFloat(menuFormData.price),
        description: menuFormData.description,
        available: menuFormData.available,
        image: menuFormData.image, // Emoji/Unicode
        imageUrl: imageURL, // Actual uploaded image URL
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
      toast.error('Error saving menu item');
      console.error('Error:', error);
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

  const restaurantColumns = [
    { 
      field: 'logo', 
      headerName: 'Logo', 
      width: 80,
      renderCell: (params) => (
        params.value ? (
          <Avatar src={params.value} sx={{ width: 40, height: 40 }} />
        ) : (
          <Avatar sx={{ width: 40, height: 40 }}>
            <RestaurantIcon />
          </Avatar>
        )
      ),
    },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'ownerEmail', headerName: 'Owner Email', width: 200 },
    { field: 'contact', headerName: 'Contact', width: 150 },
    { field: 'address', headerName: 'Address', width: 250, flex: 1 },
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
        <Typography variant="h4">
          Restaurants Management
        </Typography>
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

      {/* Restaurant Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
                {formData.logoPreview ? (
                  <Avatar 
                    src={formData.logoPreview} 
                    sx={{ width: 100, height: 100 }} 
                  />
                ) : (
                  <Avatar sx={{ width: 100, height: 100 }}>
                    <RestaurantIcon fontSize="large" />
                  </Avatar>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <input
                  accept="image/*"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button variant="outlined" component="span" fullWidth>
                    Upload Logo (Optional)
                  </Button>
                </label>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Restaurant Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Restaurant Icon</InputLabel>
                  <Select
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    label="Restaurant Icon"
                  >
                    <MenuItem value="🍽️">🍽️ General</MenuItem>
                    <MenuItem value="🍛">🍛 Curry</MenuItem>
                    <MenuItem value="🍕">🍕 Pizza</MenuItem>
                    <MenuItem value="🍔">🍔 Burger</MenuItem>
                    <MenuItem value="🍜">🍜 Noodles</MenuItem>
                    <MenuItem value="🍱">🍱 Biryani</MenuItem>
                    <MenuItem value="🫓">🫓 South Indian</MenuItem>
                    <MenuItem value="🌮">🌮 Mexican</MenuItem>
                    <MenuItem value="🍣">🍣 Japanese</MenuItem>
                    <MenuItem value="🥘">🥘 Multi Cuisine</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Owner Email"
                  name="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  placeholder="Restaurant Contact"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Owner Phone"
                  name="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  placeholder="Owner's Personal Phone"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cuisine Type"
                  name="cuisine"
                  value={formData.cuisine}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  placeholder="e.g., Indian, Chinese, Italian"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Delivery Time"
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleInputChange}
                  required
                  margin="normal"
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
                  margin="normal"
                  inputProps={{ step: '0.1', min: '0', max: '5' }}
                  placeholder="4.5"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                  }
                  label="Active Restaurant"
                  sx={{ mt: 2 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : editingRestaurant ? 'Update' : 'Add'}
            </Button>
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