import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Coffee, LayoutDashboard, ClipboardList, History, FolderTree, Tag, Sliders, LogOut } from 'lucide-react';
import { authService } from '../services/authService';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = authService.getRole();
  const name = authService.getName();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { name: 'Live Orders', path: '/orders', icon: ClipboardList, roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
    { name: 'Order History', path: '/order-history', icon: History, roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
    { name: 'Categories', path: '/categories', icon: FolderTree, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { name: 'Products', path: '/products', icon: Tag, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { name: 'Customizations', path: '/customizations', icon: Sliders, roles: ['SUPER_ADMIN', 'MANAGER'] },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Filter menu items by active user role
  const visibleItems = menuItems.filter(item => item.roles.includes(role || ''));

  return (
    <aside className="w-72 bg-cafeflow-dark text-cafeflow-bgSecondary flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-cafeflow-accent/20">
      <div className="space-y-8 p-6">
        {/* Brand */}
        <div className="flex items-center gap-3 pt-2">
          <Coffee className="w-8 h-8 text-cafeflow-cta" />
          <span className="font-serif text-3xl font-bold tracking-tight text-white">CafeFlow</span>
        </div>

        {/* User Card */}
        <div className="bg-cafeflow-accent/20 p-4 rounded-2xl border border-cafeflow-accent/20 space-y-1.5 shadow-sm">
          <p className="text-sm text-white font-bold truncate">{name || 'Barista'}</p>
          <span className="text-xs bg-cafeflow-cta text-white px-2.5 py-1 rounded-md uppercase tracking-wider font-extrabold inline-block">
            {role === 'ADMIN' ? 'Super Admin' : 'Barista Staff'}
          </span>
        </div>

        {/* Links */}
        <nav className="space-y-2">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl text-base font-bold tracking-wide transition-all ${
                  isActive 
                    ? 'bg-cafeflow-cta text-white shadow-lg scale-[1.02]' 
                    : 'hover:bg-cafeflow-accent/25 text-cafeflow-light/90 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-6 border-t border-cafeflow-accent/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl text-base font-bold tracking-wide text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
