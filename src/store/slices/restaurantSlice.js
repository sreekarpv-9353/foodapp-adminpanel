import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  restaurants: [],
  loading: false,
  error: null,
};

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    setRestaurants: (state, action) => {
      state.restaurants = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addRestaurant: (state, action) => {
      state.restaurants.push(action.payload);
    },
    updateRestaurant: (state, action) => {
      const index = state.restaurants.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.restaurants[index] = action.payload;
      }
    },
    deleteRestaurant: (state, action) => {
      state.restaurants = state.restaurants.filter(r => r.id !== action.payload);
    },
  },
});

export const { 
  setRestaurants, 
  setLoading, 
  setError, 
  addRestaurant, 
  updateRestaurant, 
  deleteRestaurant 
} = restaurantSlice.actions;

export default restaurantSlice.reducer;