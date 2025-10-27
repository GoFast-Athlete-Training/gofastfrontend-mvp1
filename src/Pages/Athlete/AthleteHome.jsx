import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

const AthleteHome = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const mainFeatures = [
    {
      title: "Connect",
      description: "Find your running crew and accountability partners",
      icon: "👥",
      path: "/connect",
      color: "bg-orange-500"
    },
    {
      title: "Train", 
      description: "Personalized training plans and progress tracking",
      icon: "🏃‍♂️",
      path: "/training-hub",
      color: "bg-blue-500"
    },
    {
      title: "Shop",
      description: "Earn points and redeem exclusive running gear",
      icon: "🛍️",
      path: "/shop",
      color: "bg-green-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logo.jpg" alt="GoFast" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-bold text-gray-900">GoFast</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile-setup')}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Profile
              </button>
              <button
                onClick={handleSignOut}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to GoFast!
          </h1>
          <p className="text-xl text-gray-600">
            Ready to crush your running goals? Choose where to start:
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {mainFeatures.map((feature, index) => (
            <div 
              key={index}
              onClick={() => navigate(feature.path)}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 text-center"
            >
              <div className="text-6xl mb-6">{feature.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-lg mb-6">
                {feature.description}
              </p>
              <div className={`${feature.color} text-white px-6 py-3 rounded-lg font-bold text-lg`}>
                Get Started
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Your Running Journey
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">0</div>
              <div className="text-gray-600">Miles This Week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
              <div className="text-gray-600">Runs Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">0</div>
              <div className="text-gray-600">Points Earned</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteHome;
