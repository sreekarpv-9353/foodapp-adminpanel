import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  orders: [],
  loading: false,
  error: null,
};

const grocerySlice = createSlice({
  name: 'grocery',
  initialState,
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload;
    },
    setOrders: (state, action) => {
      state.orders = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addItem: (state, action) => {
      state.items.push(action.payload);
    },
    updateItem: (state, action) => {
      const index = state.items.findIndex(i => i.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.status = status;
      }
    },
  },
});

export const { 
  setItems, 
  setOrders, 
  setLoading, 
  setError, 
  addItem, 
  updateItem, 
  updateOrderStatus 
} = grocerySlice.actions;

export default grocerySlice.reducer;