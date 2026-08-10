import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import FullMenu from './pages/FullMenu';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import VerifyOtp from './pages/VerifyOtp';
import Payment from './pages/Payment';
import OrderConfirmation from './pages/OrderConfirmation';
import TrackOrder from './pages/TrackOrder';
import Feedback from './pages/Feedback';
import MyOrders from './pages/MyOrders';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/menu" element={<FullMenu />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
        <Route path="/track-order/:id" element={<TrackOrder />} />
        <Route path="/feedback/:id" element={<Feedback />} />
        <Route path="/my-orders" element={<MyOrders />} />
      </Routes>
    </BrowserRouter>
  );
}
