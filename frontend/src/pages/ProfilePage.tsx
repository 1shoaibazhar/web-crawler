import React from 'react';
import { Layout } from '../components/common/Layout';
import { Header } from '../components/common/Header';

export const ProfilePage: React.FC = () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <Layout
      header={<Header title="Profile" user={mockUser} onLogout={handleLogout} />}
    >
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={mockUser.name}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={mockUser.email}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Member Since</label>
              <input
                type="text"
                value={new Date(mockUser.created_at).toLocaleDateString()}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                readOnly
              />
            </div>
            
            <div className="pt-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage; 