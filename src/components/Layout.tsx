import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, UserSquare2, LogOut } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './Button';

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['CANDIDATO', 'LIDERANCA'] },
    { name: 'Lideranças', path: '/liderancas', icon: UserSquare2, roles: ['CANDIDATO'] },
    { name: 'Chefes', path: '/chefes-familia', icon: Users, roles: ['CANDIDATO', 'LIDERANCA'] },
    { name: 'Eleitores', path: '/integrantes', icon: Users, roles: ['CANDIDATO', 'LIDERANCA'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  const pageTitle = filteredNavItems.find(item => item.path === location.pathname)?.name || 'Voto Certo';

  return (
    <div className="flex h-screen w-full bg-gray-50 flex-col md:flex-row overflow-hidden">
      
      {/* Mobile Header */}
      <header className="md:hidden flex h-16 shrink-0 items-center justify-between bg-white px-4 shadow-sm z-20 relative">
        <h1 className="text-xl font-bold text-primary">{pageTitle}</h1>
        <button onClick={handleLogout} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Sair">
          <LogOut size={20} />
        </button>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white shadow-lg z-30 h-full shrink-0">
        <div className="flex h-16 items-center justify-center border-b px-4 shrink-0">
          <h1 className="text-2xl font-bold text-primary">Voto Certo</h1>
        </div>
        
        <div className="p-4 border-b bg-gray-50 shrink-0">
          <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.role}</p>
        </div>

        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  )
                }
              >
                <Icon size={20} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t shrink-0">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
            <LogOut size={20} className="mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-7xl mx-auto pb-24 md:pb-8 relative">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around h-16 z-30 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 text-[10px] font-medium transition-colors px-1",
                  isActive ? "text-primary" : "text-gray-500 hover:text-gray-900"
                )
              }
            >
              <Icon size={22} className={cn("transition-transform", location.pathname === item.path && "scale-110")} />
              <span className="truncate w-full text-center leading-none">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

    </div>
  );
};
