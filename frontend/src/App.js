import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Heart, MapPin, Calendar, Phone, MessageCircle, Search, Plus, User, Eye, Filter, Settings } from 'lucide-react';
import UserDashboard from './components/UserDashboard';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [ads, setAds] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [loading, setLoading] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', age: '', location: '' });
  const [adForm, setAdForm] = useState({
    title: '', description: '', category: '', location: '', age: '', phone: '', whatsapp: '', image: null
  });

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadLocations();
    loadAds();
    
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Filter ads when search/filter changes
  useEffect(() => {
    filterAds();
  }, [ads, searchTerm, selectedCategory, selectedLocation]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/categories`);
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/locations`);
      const data = await response.json();
      setLocations(data.locations);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadAds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/ads`);
      const data = await response.json();
      setAds(data.ads);
    } catch (error) {
      console.error('Error loading ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAds = () => {
    let filtered = ads;

    if (searchTerm) {
      filtered = filtered.filter(ad => 
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(ad => ad.category === selectedCategory);
    }

    if (selectedLocation !== 'All') {
      filtered = filtered.filter(ad => ad.location === selectedLocation);
    }

    setFilteredAds(filtered);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...registerForm,
          age: registerForm.age ? parseInt(registerForm.age) : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Registration successful! Please login.');
        setCurrentView('login');
        setRegisterForm({ name: '', email: '', password: '', age: '', location: '' });
      } else {
        const error = await response.json();
        alert(`Registration failed: ${error.detail}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      if (response.ok) {
        const data = await response.json();
        const user = { id: data.user_id, name: data.name, email: data.email };
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentView('home');
        setLoginForm({ email: '', password: '' });
      } else {
        const error = await response.json();
        alert(`Login failed: ${error.detail}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please login to post an ad');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', adForm.title);
      formData.append('description', adForm.description);
      formData.append('category', adForm.category);
      formData.append('location', adForm.location);
      formData.append('user_id', currentUser.id);
      
      if (adForm.age) formData.append('age', adForm.age);
      if (adForm.phone) formData.append('phone', adForm.phone);
      if (adForm.whatsapp) formData.append('whatsapp', adForm.whatsapp);
      if (adForm.image) formData.append('image', adForm.image);

      const response = await fetch(`${BACKEND_URL}/api/ads`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Ad posted successfully!');
        setCurrentView('home');
        setAdForm({
          title: '', description: '', category: '', location: '', age: '', phone: '', whatsapp: '', image: null
        });
        loadAds();
      } else {
        const error = await response.json();
        alert(`Failed to post ad: ${error.detail}`);
      }
    } catch (error) {
      console.error('Ad creation error:', error);
      alert('Failed to post ad. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentView('home');
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Men Seeking Women': 'bg-blue-100 text-blue-800 border-blue-200',
      'Women Seeking Men': 'bg-pink-100 text-pink-800 border-pink-200',
      'Men Seeking Men': 'bg-purple-100 text-purple-800 border-purple-200',
      'Women Seeking Women': 'bg-rose-100 text-rose-800 border-rose-200',
      'Casual Encounters': 'bg-orange-100 text-orange-800 border-orange-200',
      'Adult Services': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const createdAt = new Date(date);
    const diffInHours = Math.floor((now - createdAt) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Header Component
  const Header = () => (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => setCurrentView('home')}
          >
            <Heart className="h-8 w-8 text-red-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              LimpopoConnect
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Button 
              variant="ghost" 
              onClick={() => setCurrentView('home')}
              className="text-gray-700 hover:text-red-500"
            >
              Home
            </Button>
            {currentUser ? (
              <>
                <Button 
                  variant="ghost"
                  onClick={() => setCurrentView('post-ad')}
                  className="text-gray-700 hover:text-red-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post Ad
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-700 hover:text-red-500"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Hi, {currentUser.name}</span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('login')}
                  className="text-gray-700 hover:text-red-500"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => setCurrentView('register')}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );

  // Hero Section
  const HeroSection = () => (
    <div className="relative bg-gradient-to-br from-red-50 to-pink-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Your
              <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent block">
                Perfect Match
              </span>
              in Limpopo
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Connect with like-minded people in your area. Whether you're looking for romance, friendship, or something casual - your perfect connection awaits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3"
                onClick={() => setCurrentView('home')}
              >
                <Search className="h-5 w-5 mr-2" />
                Browse Ads
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-red-500 text-red-500 hover:bg-red-50 px-8 py-3"
                onClick={() => currentUser ? setCurrentView('post-ad') : setCurrentView('register')}
              >
                <Plus className="h-5 w-5 mr-2" />
                Post Your Ad
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="relative z-10">
              <img
                src="https://placehold.co/800x600?text=Happy+South+African+Couple+Connecting+in+Beautiful+Limpopo+Landscape"
                alt="Happy South African Couple Connecting in Beautiful Limpopo Landscape"
                className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                onError={(e) => {
                  e.target.src = "https://placehold.co/800x600?text=LimpopoConnect+Hero+Image";
                }}
              />
            </div>
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-red-500 rounded-full opacity-20"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-pink-500 rounded-full opacity-20"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Categories Section
  const CategoriesSection = () => (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find exactly what you're looking for in our organized categories
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card 
              key={category}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-red-200"
              onClick={() => {
                setSelectedCategory(category);
                setCurrentView('home');
              }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{category}</h3>
                <Badge className={getCategoryColor(category)}>
                  {ads.filter(ad => ad.category === category).length} ads
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // Search and Filter Bar
  const SearchFilterBar = () => (
    <div className="bg-white shadow-sm border-b p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search ads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  // Ad Card Component
  const AdCard = ({ ad }) => (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group">
      <div className="relative">
        {ad.image_url ? (
          <img
            src={`${BACKEND_URL}${ad.image_url}`}
            alt={ad.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
            <User className="h-16 w-16 text-red-300" />
          </div>
        )}
        <Badge className={`absolute top-3 left-3 ${getCategoryColor(ad.category)}`}>
          {ad.category}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{ad.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ad.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {ad.location}
          </div>
          {ad.age && (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {ad.age} years
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{formatTimeAgo(ad.created_at)}</span>
          <div className="flex items-center text-xs text-gray-500">
            <Eye className="h-3 w-3 mr-1" />
            {ad.views || 0} views
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full bg-red-500 hover:bg-red-600"
          onClick={() => setSelectedAd(ad)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );

  // Ad Details Modal
  const AdDetailsModal = () => (
    <Dialog open={!!selectedAd} onOpenChange={() => setSelectedAd(null)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {selectedAd && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedAd.title}</DialogTitle>
              <Badge className={getCategoryColor(selectedAd.category)}>
                {selectedAd.category}
              </Badge>
            </DialogHeader>
            
            {selectedAd.image_url && (
              <img
                src={`${BACKEND_URL}${selectedAd.image_url}`}
                alt={selectedAd.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            
            <div className="space-y-4">
              <p className="text-gray-700">{selectedAd.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  {selectedAd.location}
                </div>
                {selectedAd.age && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    {selectedAd.age} years old
                  </div>
                )}
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  {selectedAd.user_name}
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-2 text-gray-500" />
                  {selectedAd.views || 0} views
                </div>
              </div>
              
              {(selectedAd.phone || selectedAd.whatsapp) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    {selectedAd.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-green-600" />
                        <a href={`tel:${selectedAd.phone}`} className="text-green-600 hover:underline">
                          {selectedAd.phone}
                        </a>
                      </div>
                    )}
                    {selectedAd.whatsapp && (
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                        <a 
                          href={`https://wa.me/${selectedAd.whatsapp.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline"
                        >
                          WhatsApp: {selectedAd.whatsapp}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {currentUser && currentUser.id !== selectedAd.user_id && (
                <Button className="w-full bg-blue-500 hover:bg-blue-600">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  // Login Form
  const LoginForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your LimpopoConnect account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-red-500 hover:bg-red-600" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Button variant="link" onClick={() => setCurrentView('register')} className="text-red-500 p-0">
              Sign up here
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );

  // Register Form
  const RegisterForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join LimpopoConnect</CardTitle>
          <CardDescription>Create your account to start connecting</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="age">Age (optional)</Label>
              <Input
                id="age"
                type="number"
                min="18"
                max="100"
                value={registerForm.age}
                onChange={(e) => setRegisterForm({...registerForm, age: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Select 
                value={registerForm.location} 
                onValueChange={(value) => setRegisterForm({...registerForm, location: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-red-500 hover:bg-red-600" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Button variant="link" onClick={() => setCurrentView('login')} className="text-red-500 p-0">
              Sign in here
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );

  // Post Ad Form
  const PostAdForm = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Post Your Ad</CardTitle>
            <CardDescription>Share your story and connect with someone special</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAd} className="space-y-6">
              <div>
                <Label htmlFor="title">Ad Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Looking for someone special in Polokwane"
                  value={adForm.title}
                  onChange={(e) => setAdForm({...adForm, title: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell people about yourself and what you're looking for..."
                  rows={5}
                  value={adForm.description}
                  onChange={(e) => setAdForm({...adForm, description: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={adForm.category} 
                    onValueChange={(value) => setAdForm({...adForm, category: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select 
                    value={adForm.location} 
                    onValueChange={(value) => setAdForm({...adForm, location: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="age">Your Age (optional)</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  placeholder="25"
                  value={adForm.age}
                  onChange={(e) => setAdForm({...adForm, age: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+27 123 456 7890"
                    value={adForm.phone}
                    onChange={(e) => setAdForm({...adForm, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="whatsapp">WhatsApp Number (optional)</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="+27 123 456 7890"
                    value={adForm.whatsapp}
                    onChange={(e) => setAdForm({...adForm, whatsapp: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="image">Photo (optional)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAdForm({...adForm, image: e.target.files[0]})}
                />
                <p className="text-xs text-gray-500 mt-1">Upload a photo to get more responses</p>
              </div>
              
              <Button type="submit" className="w-full bg-red-500 hover:bg-red-600" disabled={loading}>
                {loading ? 'Posting...' : 'Post My Ad'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Main Home View
  const HomeView = () => (
    <div>
      {!currentUser && <HeroSection />}
      <CategoriesSection />
      <SearchFilterBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading ads...</p>
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No ads found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search filters or be the first to post in this category!</p>
            {currentUser && (
              <Button onClick={() => setCurrentView('post-ad')} className="bg-red-500 hover:bg-red-600">
                <Plus className="h-4 w-4 mr-2" />
                Post Your Ad
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>
      <AdDetailsModal />
    </div>
  );

  // Render main app
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {currentView === 'home' && <HomeView />}
      {currentView === 'login' && <LoginForm />}
      {currentView === 'register' && <RegisterForm />}
      {currentView === 'post-ad' && <PostAdForm />}
      {currentView === 'dashboard' && currentUser && (
        <UserDashboard
          currentUser={currentUser}
          onCreateAd={() => setCurrentView('post-ad')}
          onLogout={handleLogout}
          backendUrl={BACKEND_URL}
        />
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-6 w-6 text-red-500" />
                <span className="text-xl font-bold">LimpopoConnect</span>
              </div>
              <p className="text-gray-400">
                Connecting hearts across Limpopo province. Find your perfect match in your local area.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Popular Locations</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Polokwane</li>
                <li>Tzaneen</li>
                <li>Makhado</li>
                <li>Thohoyandou</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Categories</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Dating</li>
                <li>Friendship</li>
                <li>Casual Encounters</li>
                <li>Long-term Relationships</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LimpopoConnect. Made with ❤️ for South Africa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;