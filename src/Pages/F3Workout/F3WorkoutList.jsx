import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { Plus, Calendar } from 'lucide-react';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

export default function F3WorkoutList() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/f3workout');
      if (response.data.success) {
        setWorkouts(response.data.data || []);
      } else {
        setError(response.data.error || 'Failed to fetch workouts');
      }
    } catch (err) {
      console.error('Error fetching workouts:', err);
      setError(err.response?.data?.error || 'Failed to fetch workouts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">F3 Workouts</h1>
          <button
            onClick={() => navigate('/f3workouts/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Workout
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {workouts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No workouts yet</p>
            <button
              onClick={() => navigate('/f3workouts/new')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Workout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <div
                key={workout.workoutId}
                onClick={() => navigate(`/f3workouts/${workout.workoutId}`)}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {workout.ao || 'Workout'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(workout.date)}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">Q: {workout.qId}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {workout.warmup && workout.warmup.moves.length > 0 && (
                        <span className="block">Warm-Up: {workout.warmup.moves.length} moves</span>
                      )}
                      {workout.thang && workout.thang.blocks.length > 0 && (
                        <span className="block">Thang: {workout.thang.blocks.length} blocks</span>
                      )}
                      {workout.mary && workout.mary.moves.length > 0 && (
                        <span className="block">Mary: {workout.mary.moves.length} moves</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

