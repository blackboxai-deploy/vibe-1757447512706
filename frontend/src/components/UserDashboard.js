import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Edit, Trash2, Eye, MessageCircle, Plus, User } from 'lucide-react';

const UserDashboard = ({ currentUser, onCreateAd, onLogout, backendUrl }) => {
  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadUserAds();
    }
  }, [currentUser]);

  const loadUserAds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/ads`);
      const data = await response.json();
      // Filter ads by current user
      const myAds = data.ads.filter(ad => ad.user_id === currentUser.id);
      setUserAds(myAds);
    } catch (error) {
      console.error('Error loading user ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAd = async (adId) => {
    try {
      // Note: Backend doesn't have delete endpoint yet, but we'll simulate it
      console.log('Delete ad:', adId);
      alert('Delete functionality will be implemented in backend');
      // Remove from local state for now
      setUserAds(userAds.filter(ad => ad.id !== adId));
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Failed to delete ad');
    }
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

  const AdCard = ({ ad }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative">
        {ad.image_url ? (
          <img
            src={`${backendUrl}${ad.image_url}`}
            alt={ad.title}
            className="w-full h-32 object-cover"
          />
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
            <User className="h-8 w-8 text-red-300" />
          </div>
        )}
        <Badge className={`absolute top-2 left-2 text-xs ${getCategoryColor(ad.category)}`}>
          {ad.category}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{ad.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ad.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{formatTimeAgo(ad.created_at)}</span>
          <div className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {ad.views || 0} views
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1"
          onClick={() => setSelectedAd(ad)}
        >
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Ad</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{ad.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => deleteAd(ad.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );

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
                src={`${backendUrl}${selectedAd.image_url}`}
                alt={selectedAd.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            
            <div className="space-y-4">
              <p className="text-gray-700">{selectedAd.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <span className="font-semibold mr-2">Location:</span>
                  {selectedAd.location}
                </div>
                {selectedAd.age && (
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Age:</span>
                    {selectedAd.age} years old
                  </div>
                )}
                <div className="flex items-center">
                  <span className="font-semibold mr-2">Views:</span>
                  {selectedAd.views || 0}
                </div>
                <div className="flex items-center">
                  <span className="font-semibold mr-2">Posted:</span>
                  {formatTimeAgo(selectedAd.created_at)}
                </div>
              </div>
              
              {(selectedAd.phone || selectedAd.whatsapp) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    {selectedAd.phone && (
                      <div>
                        <span className="font-semibold">Phone:</span> {selectedAd.phone}
                      </div>
                    )}
                    {selectedAd.whatsapp && (
                      <div>
                        <span className="font-semibold">WhatsApp:</span> {selectedAd.whatsapp}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {currentUser?.name}!
              </h1>
              <p className="text-gray-600">
                Manage your ads and connections from your personal dashboard
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <Button 
                onClick={onCreateAd}
                className="bg-red-500 hover:bg-red-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Ad
              </Button>
              <Button variant="outline" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="my-ads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-ads">My Ads</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          {/* My Ads Tab */}
          <TabsContent value="my-ads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Ads</CardTitle>
                <CardDescription>
                  You have {userAds.length} active ad{userAds.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading your ads...</p>
                  </div>
                ) : userAds.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No ads yet</h3>
                    <p className="text-gray-600 mb-4">Create your first ad to start connecting with people!</p>
                    <Button onClick={onCreateAd} className="bg-red-500 hover:bg-red-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Ad
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userAds.map((ad) => (
                      <AdCard key={ad.id} ad={ad} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>
                  Chat with people who are interested in your ads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-600">Messages from interested people will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your account information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">{currentUser?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{currentUser?.email}</p>
                  </div>
                </div>
                <div className="pt-4">
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <AdDetailsModal />
    </div>
  );
};

export default UserDashboard;