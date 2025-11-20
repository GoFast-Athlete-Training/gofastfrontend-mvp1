import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { ArrowLeft, ArrowRight, Plus, X, Trash2 } from 'lucide-react';
import useHydratedAthlete from '../../hooks/useHydratedAthlete';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

// Enum values
const WARM_UP_MOVE_TYPES = [
  'SSH', 'ImperialWalkers', 'ArmCircles', 'HighKnees', 'Windmills', 'Skaters', 'Mosey'
];

const THANG_MOVE_TYPES = [
  'Merkins', 'Squats', 'Burpees', 'BearCrawl', 'BroadJump', 'LungeWalk',
  'ShoulderTap', 'JumpSquat', 'MountainClimber', 'RickyBobby', 'Sprint', 'Mosey', 'Karaoke'
];

const MARY_TYPES = [
  'FlutterKicks', 'LBCs', 'AmericanHammers', 'FreddieMercurys',
  'BigBoySitups', 'HelloDollies', 'Plank'
];

export default function F3WorkoutBuilder() {
  const navigate = useNavigate();
  const { athleteId } = useHydratedAthlete();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Basic Info
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [ao, setAo] = useState('');
  const [qId, setQId] = useState('');

  // Step 2: Warm-Up
  const [warmupMoves, setWarmupMoves] = useState([]);

  // Step 3: The Thang
  const [thangBlocks, setThangBlocks] = useState([]);

  // Step 4: Mary
  const [maryMoves, setMaryMoves] = useState([]);

  // Step 5: COT
  const [cot, setCot] = useState('');

  useEffect(() => {
    // Auto-fill Q from current user
    if (athleteId) {
      setQId(athleteId);
    }
  }, [athleteId]);

  const addWarmupMove = () => {
    setWarmupMoves([...warmupMoves, { type: 'SSH', count: null }]);
  };

  const updateWarmupMove = (index, field, value) => {
    const updated = [...warmupMoves];
    updated[index] = { ...updated[index], [field]: value };
    setWarmupMoves(updated);
  };

  const removeWarmupMove = (index) => {
    setWarmupMoves(warmupMoves.filter((_, i) => i !== index));
  };

  const addThangBlock = () => {
    setThangBlocks([...thangBlocks, {
      title: '',
      description: '',
      order: thangBlocks.length,
      moves: []
    }]);
  };

  const updateThangBlock = (blockIndex, field, value) => {
    const updated = [...thangBlocks];
    updated[blockIndex] = { ...updated[blockIndex], [field]: value };
    setThangBlocks(updated);
  };

  const addThangMove = (blockIndex) => {
    const updated = [...thangBlocks];
    updated[blockIndex].moves = [...updated[blockIndex].moves, {
      type: 'Merkins',
      reps: null,
      distanceYards: null,
      durationSec: null,
      notes: '',
      order: updated[blockIndex].moves.length
    }];
    setThangBlocks(updated);
  };

  const updateThangMove = (blockIndex, moveIndex, field, value) => {
    const updated = [...thangBlocks];
    updated[blockIndex].moves[moveIndex] = {
      ...updated[blockIndex].moves[moveIndex],
      [field]: value === '' ? null : value
    };
    setThangBlocks(updated);
  };

  const removeThangMove = (blockIndex, moveIndex) => {
    const updated = [...thangBlocks];
    updated[blockIndex].moves = updated[blockIndex].moves.filter((_, i) => i !== moveIndex);
    setThangBlocks(updated);
  };

  const removeThangBlock = (blockIndex) => {
    setThangBlocks(thangBlocks.filter((_, i) => i !== blockIndex));
  };

  const addMaryMove = () => {
    setMaryMoves([...maryMoves, { type: 'FlutterKicks', count: null }]);
  };

  const updateMaryMove = (index, field, value) => {
    const updated = [...maryMoves];
    updated[index] = { ...updated[index], [field]: value === '' ? null : value };
    setMaryMoves(updated);
  };

  const removeMaryMove = (index) => {
    setMaryMoves(maryMoves.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const payload = {
        date,
        ao: ao.trim() || null,
        qId: qId.trim(),
        warmup: warmupMoves.length > 0 ? { moves: warmupMoves } : null,
        thang: thangBlocks.length > 0 ? { blocks: thangBlocks } : null,
        mary: maryMoves.length > 0 ? { moves: maryMoves } : null,
        cot: cot.trim() || null,
      };

      const response = await api.post('/f3workout', payload);

      if (response.data.success) {
        navigate(`/f3workouts/${response.data.data.workoutId}`);
      } else {
        setError(response.data.error || 'Failed to create workout');
      }
    } catch (err) {
      console.error('Error creating workout:', err);
      setError(err.response?.data?.error || 'Failed to create workout');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Basic Info</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date *
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AO (Area of Operations)
        </label>
        <input
          type="text"
          value={ao}
          onChange={(e) => setAo(e.target.value)}
          placeholder="e.g., The Point"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Q (QID) *
        </label>
        <input
          type="text"
          value={qId}
          onChange={(e) => setQId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
          required
          readOnly
        />
        <p className="mt-1 text-sm text-gray-500">Auto-filled from current user</p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Warm-Up</h2>
        <button
          onClick={addWarmupMove}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Move
        </button>
      </div>

      {warmupMoves.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No warm-up moves added yet</p>
      ) : (
        <div className="space-y-4">
          {warmupMoves.map((move, index) => (
            <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={move.type}
                    onChange={(e) => updateWarmupMove(index, 'type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {WARM_UP_MOVE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Count
                  </label>
                  <input
                    type="number"
                    value={move.count || ''}
                    onChange={(e) => updateWarmupMove(index, 'count', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={() => removeWarmupMove(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">The Thang</h2>
        <button
          onClick={addThangBlock}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Block
        </button>
      </div>

      {thangBlocks.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No blocks added yet</p>
      ) : (
        <div className="space-y-6">
          {thangBlocks.map((block, blockIndex) => (
            <div key={blockIndex} className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Block {blockIndex + 1}</h3>
                <button
                  onClick={() => removeThangBlock(blockIndex)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Block Title
                  </label>
                  <input
                    type="text"
                    value={block.title}
                    onChange={(e) => updateThangBlock(blockIndex, 'title', e.target.value)}
                    placeholder="e.g., Round 1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={block.description}
                    onChange={(e) => updateThangBlock(blockIndex, 'description', e.target.value)}
                    placeholder="Optional description"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-700">Moves</h4>
                  <button
                    onClick={() => addThangMove(blockIndex)}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Move
                  </button>
                </div>

                {block.moves.length === 0 ? (
                  <p className="text-gray-500 text-sm">No moves in this block</p>
                ) : (
                  <div className="space-y-3">
                    {block.moves.map((move, moveIndex) => (
                      <div key={moveIndex} className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-medium text-gray-700">Move {moveIndex + 1}</h5>
                          <button
                            onClick={() => removeThangMove(blockIndex, moveIndex)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Type
                            </label>
                            <select
                              value={move.type}
                              onChange={(e) => updateThangMove(blockIndex, moveIndex, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                              {THANG_MOVE_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Reps
                            </label>
                            <input
                              type="number"
                              value={move.reps || ''}
                              onChange={(e) => updateThangMove(blockIndex, moveIndex, 'reps', e.target.value)}
                              placeholder="Optional"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Distance (yards)
                            </label>
                            <input
                              type="number"
                              value={move.distanceYards || ''}
                              onChange={(e) => updateThangMove(blockIndex, moveIndex, 'distanceYards', e.target.value)}
                              placeholder="Optional"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Duration (sec)
                            </label>
                            <input
                              type="number"
                              value={move.durationSec || ''}
                              onChange={(e) => updateThangMove(blockIndex, moveIndex, 'durationSec', e.target.value)}
                              placeholder="Optional"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Notes
                            </label>
                            <input
                              type="text"
                              value={move.notes || ''}
                              onChange={(e) => updateThangMove(blockIndex, moveIndex, 'notes', e.target.value)}
                              placeholder="Optional notes"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Mary</h2>
        <button
          onClick={addMaryMove}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Move
        </button>
      </div>

      {maryMoves.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No Mary moves added yet</p>
      ) : (
        <div className="space-y-4">
          {maryMoves.map((move, index) => (
            <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={move.type}
                    onChange={(e) => updateMaryMove(index, 'type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {MARY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Count
                  </label>
                  <input
                    type="number"
                    value={move.count || ''}
                    onChange={(e) => updateMaryMove(index, 'count', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={() => removeMaryMove(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">COT (Circle of Trust)</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          COT Notes
        </label>
        <textarea
          value={cot}
          onChange={(e) => setCot(e.target.value)}
          placeholder="Enter COT notes, announcements, prayers, etc."
          rows={10}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Create F3 Workout</h1>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step === s
                        ? 'bg-blue-600 text-white'
                        : step > s
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {s}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:inline">
                    {s === 1 && 'Basic Info'}
                    {s === 2 && 'Warm-Up'}
                    {s === 3 && 'The Thang'}
                    {s === 4 && 'Mary'}
                    {s === 5 && 'COT'}
                  </span>
                </div>
                {s < 5 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep(Math.min(5, step + 1))}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !date || !qId}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Workout'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

