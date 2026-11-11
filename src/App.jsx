import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import ChatPage from './pages/ChatPage';
import HomePage from './pages/HomePage';
import LoginCallbackPage from './pages/LoginCallbackPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import OrderListPage from './pages/OrderListPage';
import PasswordResetPage from './pages/PasswordResetPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductListPage from './pages/ProductListPage';
import SignupPage from './pages/SignupPage';
import SignupSocialPage from './pages/SignupSocialPage';
import PaymentMethodPage from './pages/PaymentMethodPage';
import AddressPage from './pages/AddressPage';
import WithdrawPage from './pages/WithdrawPage';

// 메인·상품은 로그인 없이 볼 수 있고, 채팅·주문은 로그인해야 들어갈 수 있음
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="signup/social" element={<SignupSocialPage />} />
        <Route path="auth/:provider/callback" element={<LoginCallbackPage />} />
        <Route path="password/reset" element={<PasswordResetPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/:productCode" element={<ProductDetailPage />} />
        <Route element={<RequireAuth />}>
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:roomId" element={<ChatPage />} />
          <Route path="orders" element={<OrderListPage />} />
          <Route path="withdraw" element={<WithdrawPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="payment-methods" element={<PaymentMethodPage />} />
          <Route path="addresses" element={<AddressPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
