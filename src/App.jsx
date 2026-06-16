import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// User screens
import HomeScreen from './screens/user/HomeScreen';
import RxUploadScreen from './screens/user/RxUploadScreen';
import CartScreen from './screens/user/CartScreen';
import CheckoutScreen from './screens/user/CheckoutScreen';
import OrderTrackingScreen from './screens/user/OrderTrackingScreen';
import ExploreScreen from './screens/user/ExploreScreen';
import ProfileScreen from './screens/user/ProfileScreen';

// Pharmacy screens
import PharmacyDashboard from './screens/pharmacy/PharmacyDashboard';
import FlashTerminalScreen from './screens/pharmacy/FlashTerminalScreen';
import PackagingChecklistScreen from './screens/pharmacy/PackagingChecklistScreen';
import PharmacyHistoryScreen from './screens/pharmacy/PharmacyHistoryScreen';
import PharmacyStatsScreen from './screens/pharmacy/PharmacyStatsScreen';
import PharmacySettingsScreen from './screens/pharmacy/PharmacySettingsScreen';
import PharmacyStoreScreen from './screens/pharmacy/PharmacyStoreScreen';

// Rider screen
import RiderScreen from './screens/rider/RiderScreen';

// Labs screen
import LabsDashboard from './screens/labs/LabsDashboard';

// Shared components
import Toast from './components/Toast';
import DevModeToggle from './components/DevModeToggle';
import AuthScreen from './screens/shared/AuthScreen';

function AppRoutes() {
  const { state } = useApp();

  return (
    <>
      <Routes>
        {/* User App Routes */}
        <Route path="/user/login" element={<AuthScreen portal="user" />} />
        <Route path="/user" element={<HomeScreen />} />
        <Route path="/user/rx-upload" element={<RxUploadScreen />} />
        <Route path="/user/cart" element={<CartScreen />} />
        <Route path="/user/checkout" element={<CheckoutScreen />} />
        <Route path="/user/tracking" element={<OrderTrackingScreen />} />
        <Route path="/user/explore" element={<ExploreScreen />} />
        <Route path="/user/profile" element={<ProfileScreen />} />

        {/* Pharmacy App Routes */}
        <Route path="/pharmacy/login" element={<AuthScreen portal="pharmacy" />} />
        <Route path="/pharmacy" element={<PharmacyDashboard />} />
        <Route path="/pharmacy/flash" element={<FlashTerminalScreen />} />
        <Route path="/pharmacy/packaging" element={<PackagingChecklistScreen />} />
        <Route path="/pharmacy/history" element={<PharmacyHistoryScreen />} />
        <Route path="/pharmacy/stats" element={<PharmacyStatsScreen />} />
        <Route path="/pharmacy/settings" element={<PharmacySettingsScreen />} />
        <Route path="/pharmacy/store" element={<PharmacyStoreScreen />} />

        {/* Rider App Routes */}
        <Route path="/rider/login" element={<AuthScreen portal="rider" />} />
        <Route path="/rider" element={<RiderScreen />} />

        {/* Labs App Routes */}
        <Route path="/labs/login" element={<AuthScreen portal="labs" />} />
        <Route path="/labs" element={<LabsDashboard />} />

        {/* Default */}
        <Route path="/" element={<Navigate to="/user" replace />} />
        <Route path="*" element={<Navigate to="/user" replace />} />
      </Routes>

      {/* Global Toast */}
      {state.toast && <Toast toast={state.toast} />}

      {/* Dev Mode Toggle - always visible */}
      <DevModeToggle />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
