import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Liderancas } from './pages/Liderancas';
import { ChefesFamilia } from './pages/ChefesFamilia';
import { Integrantes } from './pages/Integrantes';
import { ChefeFamiliaDetalhes } from './pages/ChefeFamiliaDetalhes';

const PrivateRoute = ({ children, roles }: { children: ReactNode, roles?: string[] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="liderancas" element={<PrivateRoute roles={['CANDIDATO']}><Liderancas /></PrivateRoute>} />
        <Route path="chefes-familia" element={<ChefesFamilia />} />
        <Route path="chefes-familia/:id" element={<ChefeFamiliaDetalhes />} />
        <Route path="integrantes" element={<Integrantes />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-center"
          gutter={8}
          containerStyle={{
            top: 20,
            bottom: 'auto',
          }}
          toastOptions={{
            duration: 2500,
            success: {
              duration: 2500,
            },
            error: {
              duration: 3500,
            },
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <div
                  onClick={() => {
                    toast.dismiss(t.id);
                    toast.remove(t.id);
                  }}
                  className="flex items-center gap-2 cursor-pointer select-none"
                  title="Clique para fechar"
                >
                  {icon}
                  <span className="text-sm font-medium">{message}</span>
                  {t.type !== 'loading' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                        toast.remove(t.id);
                      }}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Fechar"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
            </ToastBar>
          )}
        </Toaster>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
