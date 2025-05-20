"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  BarChart3,
  Package,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Sword,
  Grid3X3,
  Album,
  Star,
  FileType,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  // Navigation items
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/items", label: "Items", icon: Package },
    { href: "/users", label: "Users", icon: Users },
    { href: "/weapons", label: "Weapons", icon: Sword },
    { href: "/categories", label: "Categories", icon: Grid3X3 },
    { href: "/collections", label: "Collections", icon: Album },
    { href: "/rarities", label: "Rarities", icon: Star },
    { href: "/types", label: "Types", icon: FileType },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  // Получаем инициалы пользователя для аватара
  const getUserInitials = () => {
    if (!user || !user.username) return "U"
    return user.username.charAt(0).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-40 h-full w-64 bg-zinc-900 border-r border-zinc-800 transition-transform
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}
      >
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Admin Dashboard
          </h1>
        </div>

        {/* User profile in sidebar */}
        {user && (
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                <AvatarFallback className="bg-zinc-700">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="font-medium truncate">{user.username}</p>
                <p className="text-xs text-zinc-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                  isActive ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-zinc-800">
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 justify-start"
          >
            <LogOut size={20} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Top bar for mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-900 border-b border-zinc-800 z-30 flex items-center justify-end px-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full" size="icon">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                  <AvatarFallback className="bg-zinc-700">{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-zinc-400">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                className="text-zinc-300 hover:text-zinc-100 focus:text-zinc-100 focus:bg-zinc-800 cursor-pointer"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Выйти</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Main content */}
      <main className="lg:ml-64 p-6 pt-20 lg:pt-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
