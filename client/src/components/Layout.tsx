import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  Home, Users, Info, LayoutDashboard, HelpCircle,
  LogIn, LogOut, Menu, X, Moon, Star, Wallet,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import backgroundImage from "@assets/background.webp";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/readers", label: "Readers", icon: Star },
  { path: "/about", label: "About", icon: Info },
  { path: "/community", label: "Community", icon: Users },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, auth: true },
  { path: "/help", label: "Help", icon: HelpCircle },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = navItems.filter(item => !item.auth || isAuthenticated);

  return (
    <div className="min-h-screen star-field relative" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="cosmic-bg" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="celestial-overlay" />

      <header className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-xl" style={{ backgroundColor: 'rgba(10, 10, 15, 0.85)' }} data-testid="header-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group" data-testid="link-home-logo">
              <Moon className="w-6 h-6 text-soulseer-pink group-hover:rotate-12 transition-transform" />
              <span className="font-alex text-soulseer-pink text-3xl tracking-wide">SoulSeer</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1" data-testid="nav-desktop">
              {visibleNav.map(item => {
                const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <Link key={item.path} href={item.path}>
                    <span
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-playfair transition-all cursor-pointer ${
                        isActive
                          ? "text-soulseer-pink bg-pink-500/10"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div className="hidden sm:flex items-center gap-3">
                  {user?.role === "client" && (
                    <span className="text-soulseer-gold text-sm font-semibold flex items-center gap-1" data-testid="text-balance">
                      <Wallet className="w-3.5 h-3.5" />
                      ${parseFloat(user.balance || "0").toFixed(2)}
                    </span>
                  )}
                  <span className="text-sm text-white/70 font-playfair">{user?.displayName}</span>
                  <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-white" data-testid="button-logout">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={login} className="hidden sm:flex bg-pink-500 hover:bg-pink-600 text-white font-playfair" data-testid="button-login">
                  <LogIn className="w-4 h-4 mr-1.5" /> Sign In
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-border/40 backdrop-blur-xl" style={{ backgroundColor: 'rgba(10, 10, 15, 0.95)' }} data-testid="nav-mobile">
            <div className="px-4 py-3 space-y-1">
              {visibleNav.map(item => {
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <span
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-playfair cursor-pointer ${
                        isActive ? "text-soulseer-pink bg-pink-500/10" : "text-muted-foreground"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              <div className="border-t border-border/40 pt-2 mt-2">
                {isAuthenticated ? (
                  <>
                    <div className="px-3 py-2 text-sm text-white/70 font-playfair">{user?.displayName} ({user?.role})</div>
                    <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground w-full font-playfair">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => { login(); setMobileOpen(false); }} className="mx-3 bg-pink-500 hover:bg-pink-600 text-white font-playfair">
                    <LogIn className="w-4 h-4 mr-1.5" /> Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {children}
      </main>

      <footer className="relative z-10 border-t border-border/40 mt-20" style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <span className="font-alex text-soulseer-pink text-2xl">SoulSeer</span>
              <p className="mt-2 text-sm text-white/50 font-playfair">A Community of Gifted Psychics</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-soulseer-gold font-playfair">Platform</h4>
              <div className="space-y-2 text-sm text-white/50 font-playfair">
                <Link href="/readers"><span className="hover:text-white cursor-pointer block">Find a Reader</span></Link>
                <Link href="/about"><span className="hover:text-white cursor-pointer block">About Us</span></Link>
                <Link href="/help"><span className="hover:text-white cursor-pointer block">Help Center</span></Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-soulseer-gold font-playfair">Community</h4>
              <div className="space-y-2 text-sm text-white/50 font-playfair">
                <Link href="/community"><span className="hover:text-white cursor-pointer block">Forum</span></Link>
                <a href="https://discord.gg/soulseer" target="_blank" rel="noopener noreferrer" className="hover:text-white block">Discord</a>
                <a href="https://facebook.com/groups/soulseer" target="_blank" rel="noopener noreferrer" className="hover:text-white block">Facebook</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-soulseer-gold font-playfair">Legal</h4>
              <div className="space-y-2 text-sm text-white/50 font-playfair">
                <span className="block">Privacy Policy</span>
                <span className="block">Terms of Service</span>
                <span className="block">Refund Policy</span>
              </div>
            </div>
          </div>
          <div className="border-t border-border/40 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/40 font-playfair">&copy; {new Date().getFullYear()} SoulSeer. All rights reserved.</p>
            <PerplexityAttribution />
          </div>
        </div>
      </footer>
    </div>
  );
}
