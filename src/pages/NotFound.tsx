import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { PawPrint, ArrowLeft } from "lucide-react";
import SEO from '@/components/SEO';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <SEO title="Página não encontrada" description="A página que você procura não existe." noIndex />
      <div className="text-center max-w-md animate-scale-in">
        {/* Logo */}
        <div className="w-16 h-16 gradient-purple rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-depth-md">
          <PawPrint className="w-8 h-8 text-white" />
        </div>

        <p className="text-sm font-medium text-primary/80 mb-3 tracking-wider uppercase">Error 404</p>
        <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">Page not found</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-purple text-white font-medium text-sm hover:opacity-90 smooth-transition shadow-sm hover-glow"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
