import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { ShoppingCart, Share2, Package, BarChart3 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">ShopEase</h1>
          </div>
          <Button onClick={() => (window.location.href = getLoginUrl())}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Manage Your Social Commerce in One Place
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Post to Facebook, Instagram, and TikTok. Manage inventory. Track orders.
          All from a single, beautiful dashboard.
        </p>
        <Button
          size="lg"
          onClick={() => (window.location.href = getLoginUrl())}
          className="text-lg px-8 py-6"
        >
          Get Started Free
        </Button>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Share2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Multi-Platform Posting</h4>
              <p className="text-gray-600 text-sm">
                Post to all platforms simultaneously with scheduling
              </p>
            </div>
            <div className="text-center">
              <Package className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Inventory Management</h4>
              <p className="text-gray-600 text-sm">
                Track stock and get low-stock alerts automatically
              </p>
            </div>
            <div className="text-center">
              <ShoppingCart className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Unified Orders</h4>
              <p className="text-gray-600 text-sm">
                See all orders from all platforms in one inbox
              </p>
            </div>
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Analytics</h4>
              <p className="text-gray-600 text-sm">
                Track sales trends and platform performance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Ready to grow your business?
          </h3>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of sellers managing their social commerce with ShopEase
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => (window.location.href = getLoginUrl())}
            className="text-lg px-8 py-6"
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">2026 ShopEase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
