import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { ArrowLeft, Copy, Check } from 'lucide-react';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

export default function F3WorkoutView() {
  const navigate = useNavigate();
  const { workoutId } = useParams();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backblast, setBackblast] = useState(null);
  const [generatingBackblast, setGeneratingBackblast] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchWorkout();
  }, [workoutId]);

  const fetchWorkout = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/f3workout/${workoutId}`);
      if (response.data.success) {
        setWorkout(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch workout');
      }
    } catch (err) {
      console.error('Error fetching workout:', err);
      setError(err.response?.data?.error || 'Failed to fetch workout');
    } finally {
      setLoading(false);
    }
  };

  const generateBackblast = async () => {
    try {
      setGeneratingBackblast(true);
      const response = await api.post(`/f3workout/${workoutId}/backblast`);
      if (response.data.success) {
        setBackblast(response.data.data.backblast);
      } else {
        setError(response.data.error || 'Failed to generate backblast');
      }
    } catch (err) {
      console.error('Error generating backblast:', err);
      setError(err.response?.data?.error || 'Failed to generate backblast');
    } finally {
      setGeneratingBackblast(false);
    }
  };

  const copyToClipboard = async () => {
    if (!backblast) return;
    try {
      await navigator.clipboard.writeText(backblast);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (error && !workout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/f3workouts')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Workouts
          </button>
        </div>
      </div>
    );
  }

  if (!workout) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate('/f3workouts')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workouts
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {workout.ao || 'F3 Workout'}
          </h1>
          <p className="text-gray-600 mt-2">{formatDate(workout.date)}</p>
          <p className="text-sm text-gray-500 mt-1">Q: {workout.qId}</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Warm-Up Section */}
          {workout.warmup && workout.warmup.moves.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Warm-Up</h2>
              <ul className="space-y-2">
                {workout.warmup.moves.map((move, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-gray-600">•</span>
                    <span className="font-medium">{move.type}</span>
                    {move.count && (
                      <span className="text-gray-500">x{move.count}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* The Thang Section */}
          {workout.thang && workout.thang.blocks.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">The Thang</h2>
              <div className="space-y-6">
                {workout.thang.blocks.map((block, blockIndex) => (
                  <div key={blockIndex} className="border-l-4 border-blue-500 pl-4">
                    {block.title && (
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {block.title}
                      </h3>
                    )}
                    {block.description && (
                      <p className="text-gray-600 mb-3">{block.description}</p>
                    )}
                    <ul className="space-y-2">
                      {block.moves.map((move, moveIndex) => (
                        <li key={moveIndex} className="flex items-start gap-2">
                          <span className="text-gray-600">•</span>
                          <div className="flex-1">
                            <span className="font-medium">{move.type}</span>
                            {move.reps && (
                              <span className="text-gray-500 ml-2">x{move.reps}</span>
                            )}
                            {move.distanceYards && (
                              <span className="text-gray-500 ml-2">({move.distanceYards} yards)</span>
                            )}
                            {move.durationSec && (
                              <span className="text-gray-500 ml-2">({move.durationSec}s)</span>
                            )}
                            {move.notes && (
                              <span className="text-gray-500 ml-2">- {move.notes}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mary Section */}
          {workout.mary && workout.mary.moves.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mary</h2>
              <ul className="space-y-2">
                {workout.mary.moves.map((move, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-gray-600">•</span>
                    <span className="font-medium">{move.type}</span>
                    {move.count && (
                      <span className="text-gray-500">x{move.count}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* COT Section */}
          {workout.cot && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">COT</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{workout.cot}</p>
            </div>
          )}

          {/* Backblast Generator */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Backblast</h2>
              <button
                onClick={generateBackblast}
                disabled={generatingBackblast}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generatingBackblast ? 'Generating...' : 'Generate Backblast'}
              </button>
            </div>

            {backblast && (
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={backblast}
                    readOnly
                    rows={15}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {!backblast && (
              <p className="text-gray-500 text-center py-8">
                Click "Generate Backblast" to create formatted backblast text
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

