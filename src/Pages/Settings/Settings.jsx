import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  
  // Mock connection states - in real app, this would come from API/localStorage
  const [connections, setConnections] = useState({
    garmin: false,
    strava: false
  });

  const toggleConnection = (service) => {
    setConnections(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  // API Connection cards
  const connectionCards = [
    {
      name: "Garmin Connect",
      description: "Sync your runs and activities from Garmin",
      icon: "⌚",
      color: "bg-orange-500",
      route: "/garmin/connect",
      service: "garmin"
    },
    {
      name: "Strava Connect", 
      description: "Import your activities from Strava",
      icon: "🏃",
      color: "bg-orange-600",
      route: "/settings/devices",
      service: "strava"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Device Connections</h1>
              <p className="text-gray-600">Connect your fitness devices and apps</p>
            </div>
            <button
              onClick={() => navigate("/athlete-home")}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Connection Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Connect Your Devices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connectionCards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-200 border-2 border-gray-200"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">
                    {card.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{card.name}</h3>
                  <p className="text-gray-600 text-lg mb-4">{card.description}</p>
                  
                  {/* Connection Status & Toggle */}
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                      connections[card.service] 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {connections[card.service] ? 'Connected' : 'Not Connected'}
                    </div>
                    
                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleConnection(card.service)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        connections[card.service] ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          connections[card.service] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Connect Button */}
                  {!connections[card.service] && (
                    <button
                      onClick={() => navigate(card.route)}
                      className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${card.color} hover:opacity-90`}
                    >
                      Connect {card.name}
                    </button>
                  )}
                  
                  {/* Disconnect Button */}
                  {connections[card.service] && (
                    <button
                      onClick={() => toggleConnection(card.service)}
                      className="w-full py-3 px-6 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Why Connect?</h3>
          <p className="text-blue-800">
            Connecting your devices allows GoFast to automatically track your runs, 
            sync your activities, and provide personalized insights and recommendations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
