import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrdersList from './pages/OrdersList';
import OrderHistory from './pages/OrderHistory';
import CategoryCrud from './pages/CategoryCrud';
import ProductCrud from './pages/ProductCrud';
import CustomizationCrud from './pages/CustomizationCrud';
import { authService } from './services/authService';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/orders" element={
          <ProtectedRoute>
            <OrdersList />
          </ProtectedRoute>
        } />
        
        <Route path="/order-history" element={
          <ProtectedRoute>
            <OrderHistory />
          </ProtectedRoute>
        } />
        
        <Route path="/categories" element={
          <ProtectedRoute>
            <CategoryCrud />
          </ProtectedRoute>
        } />
        
        <Route path="/products" element={
          <ProtectedRoute>
            <ProductCrud />
          </ProtectedRoute>
        } />
        
        <Route path="/customizations" element={
          <ProtectedRoute>
            <CustomizationCrud />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
