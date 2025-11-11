import React from 'react';
import { Heart, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-9 h-9 bg-background rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Paw Connect</h3>
            </div>
            <p className="text-background/70 mb-8 max-w-md leading-relaxed text-lg">
              Connecting pet owners to the best veterinary care. 
              Find qualified professionals near you in a simple and reliable way.
            </p>
            <div className="flex space-x-4">
              <div className="w-12 h-12 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 smooth-transition cursor-pointer">
                <Facebook className="w-5 h-5" />
              </div>
              <div className="w-12 h-12 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 smooth-transition cursor-pointer">
                <Instagram className="w-5 h-5" />
              </div>
              <div className="w-12 h-12 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 smooth-transition cursor-pointer">
                <Twitter className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Navigation</h4>
            <ul className="space-y-4 text-background/70">
              <li><a href="#" className="hover:text-background smooth-transition">Search Clinics</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">24h Emergency</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">Register Clinic</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">About Us</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">Contact</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Support</h4>
            <ul className="space-y-4 text-background/70">
              <li><a href="#" className="hover:text-background smooth-transition">Help Center</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">Terms of Use</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">FAQ</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 text-center text-background/60">
          <p>&copy; 2024 Paw Connect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
