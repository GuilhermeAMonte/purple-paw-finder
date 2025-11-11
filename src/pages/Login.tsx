
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Heart, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      
      toast({
        title: "Success!",
        description: "Login successful.",
      });
      
      // Redirect based on user type
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.userType === 'clinic' && !userData.isProfileComplete) {
        navigate('/clinic-setup');
      } else if (userData.userType === 'clinic') {
        navigate('/clinic-dashboard');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-purple-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with logo and back button */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-12 h-12 gradient-purple rounded-full flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
              VetFind
            </h1>
          </div>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <Card className="shadow-lg border-purple-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-800">
              Login
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  to="/forgot-password"
                  className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full gradient-purple text-white hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security information */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>🔒 Your information is protected with end-to-end encryption</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
