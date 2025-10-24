import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { store } from './store';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Restaurants from './pages/Restaurants/Restaurants';
import MenuManagement from './pages/Menu/MenuManagement';
import FoodOrders from './pages/Orders/FoodOrders';
import GroceryItems from './pages/Grocery/GroceryItems';
import GroceryOrders from './pages/Grocery/GroceryOrders';
import AppSettings from './pages/Settings/AppSettings'; // Add this import
import { useAuth } from './hooks/useAuth';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
    },
    secondary: {
      main: '#64748b',
    },
  },
});

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/restaurants" element={
                <PrivateRoute>
                  <Layout>
                    <Restaurants />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/menu/:restaurantId" element={
                <PrivateRoute>
                  <Layout>
                    <MenuManagement />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/food-orders" element={
                <PrivateRoute>
                  <Layout>
                    <FoodOrders />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/grocery-items" element={
                <PrivateRoute>
                  <Layout>
                    <GroceryItems />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/grocery-orders" element={
                <PrivateRoute>
                  <Layout>
                    <GroceryOrders />
                  </Layout>
                </PrivateRoute>
              } />
              {/* Add Settings Route */}
              <Route path="/settings" element={
                <PrivateRoute>
                  <Layout>
                    <AppSettings />
                  </Layout>
                </PrivateRoute>
              } />
            </Routes>
            <ToastContainer position="top-right" />
          </div>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;