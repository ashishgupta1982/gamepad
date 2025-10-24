import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { UserCircle, Shield } from 'lucide-react';
import { Button } from '../ui/button';

const SettingsPage = ({ session, isGuest, onSignIn, onSignOut }) => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 overflow-hidden shadow-lg rounded-xl">
        <div className="p-6 bg-white">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          <div className="space-y-6">
            {/* User Details Section */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200 px-6 py-4">
                <CardTitle className="text-gray-800 flex items-center space-x-2 text-lg">
                  <UserCircle className="w-5 h-5" />
                  <span>User Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Name</span>
                    <span className="text-sm font-medium text-gray-900">
                      {session?.user?.name || 'Guest User'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email</span>
                    <span className="text-sm font-medium text-gray-900">
                      {session?.user?.email || 'demo@example.com'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {session ? 'Authenticated' : 'Guest'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Authentication Section */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200 px-6 py-4">
                <CardTitle className="text-gray-800 flex items-center space-x-2 text-lg">
                  <Shield className="w-5 h-5" />
                  <span>Account</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isGuest ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div>
                        <h4 className="font-medium text-gray-900 text-base">Guest Mode</h4>
                        <p className="text-sm text-gray-600">Sign in to save your progress and access all features</p>
                      </div>
                      <Button
                        onClick={onSignIn}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg text-base w-full sm:w-auto"
                      >
                        Sign In
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div>
                        <h4 className="font-medium text-gray-900 text-base">Signed In</h4>
                        <p className="text-sm text-gray-600">Your progress is being saved automatically</p>
                      </div>
                      <Button
                        onClick={onSignOut}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-base w-full sm:w-auto"
                      >
                        Sign Out
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;