import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AppLayout from './layouts/AppLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SplashScreen from './pages/SplashScreen.jsx';
import { useAuthStore } from './store/authStore.js';
import './styles/index.css';

const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const ChatHome = lazy(() => import('./pages/ChatHome.jsx'));
const Conversation = lazy(() => import('./pages/Conversation.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));

function Boot() {
  const booted = useAuthStore((state) => state.booted);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  React.useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!booted) return <SplashScreen />;
  return <RouterProvider router={router} />;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> }
    ]
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <ChatHome /> },
      { path: 'chat/:conversationId', element: <Conversation /> },
      { path: 'profile', element: <Profile /> }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Suspense fallback={<SplashScreen compact />}>
          <Boot />
        </Suspense>
      </AnimatePresence>
    </ErrorBoundary>
  </React.StrictMode>
);
