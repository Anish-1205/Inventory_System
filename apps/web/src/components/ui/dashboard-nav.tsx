'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const navItems = [
  { href: '/dashboard/products', label: 'Products' },
  { href: '/dashboard/categories', label: 'Categories' },
  { href: '/dashboard/inventory', label: 'Inventory' },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="font-bold text-gray-900 text-lg">Inventory</h2>
        <p className="text-xs text-gray-400 mt-0.5">Management System</p>
      </div>
      <ul className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={clsx(
                'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
