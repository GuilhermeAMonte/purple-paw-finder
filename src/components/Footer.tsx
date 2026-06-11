import React from 'react';
import { PawPrint, Github, Twitter, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-8">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div className="w-8 h-8 bg-background/15 border border-background/20 rounded-xl flex items-center justify-center group-hover:bg-background/25 smooth-transition">
                <PawPrint className="w-4 h-4 text-background" />
              </div>
              <span className="text-[17px] font-semibold tracking-tight">PawConnect</span>
            </Link>
            <p className="text-background/60 leading-relaxed text-[15px] max-w-sm mb-7">
              Connecting pet owners to the best veterinary care. Find qualified professionals near you — fast and reliable.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Twitter,   href: '#', label: 'Twitter'   },
                { Icon: Instagram, href: '#', label: 'Instagram' },
                { Icon: Github,    href: '#', label: 'GitHub'    },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-background/10 border border-background/15 flex items-center justify-center text-background/70 hover:bg-background/20 hover:text-background smooth-transition"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-background/90 uppercase tracking-wider mb-5">Platform</h4>
            <ul className="space-y-3">
              {['Search Clinics', '24h Emergency', 'Register Clinic', 'About Us', 'Contact'].map(link => (
                <li key={link}>
                  <a href="#" className="text-background/55 hover:text-background text-sm smooth-transition underline-grow">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-background/90 uppercase tracking-wider mb-5">Support</h4>
            <ul className="space-y-3">
              {['Help Center', 'Terms of Use', 'Privacy Policy', 'FAQ'].map(link => (
                <li key={link}>
                  <a href="#" className="text-background/55 hover:text-background text-sm smooth-transition underline-grow">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-background/40 text-xs">
            © {year} PawConnect. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-background/30 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
