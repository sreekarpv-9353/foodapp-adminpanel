import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import restaurantSlice from './slices/restaurantSlice';
import orderSlice from './slices/orderSlice';
import grocerySlice from './slices/grocerySlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    restaurants: restaurantSlice,
    orders: orderSlice,
    grocery: grocerySlice,
  },
});