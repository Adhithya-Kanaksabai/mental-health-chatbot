import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Brain, Heart, Leaf, RotateCcw } from 'lucide-react';

const Techniques = () => {
  const [activeBreathing, setActiveBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('inhale');
  const [breathingCount, setBreathingCount] = useState(4);

  const startBreathingExercise = () => {
    setActiveBreathing(true);
    setBreathingPhase('inhale');
    setBreathingCount(4);

    const breathingCycle = () => {
      setBreathingPhase('inhale');
      let count = 4;
      const inhale = setInterval(() => {
        setBreathingCount(count);
        count--;
        if (count < 0) {
          clearInterval(inhale);
          setBreathingPhase('hold');
          count = 7;
          const hold = setInterval(() => {
            setBreathingCount(count);
            count--;
            if (count < 0) {
              clearInterval(hold);
              setBreathingPhase('exhale');
              count = 8;
              const exhale = setInterval(() => {
                setBreathingCount(count);
                count--;
                if (count < 0) {
                  clearInterval(exhale);
                  if (activeBreathing) setTimeout(breathingCycle, 1000);
                }
              }, 1000);
            }
          }, 1000);
        }
      }, 1000);
    };

    breathingCycle();
  };

  const stopBreathingExercise = () => {
    setActiveBreathing(false);
    setBreathingCount(4);
    setBreathingPhase('inhale');
  };

  const quickTips = [
    {
      icon: Heart,
      title: 'Start Small',
      text: 'Just 2-3 minutes daily is a good start.'
    },
    {
      icon: Leaf,
      title: 'Be Patient',
      text: 'Give yourself at least 2 weeks.'
    },
    {
      icon: RotateCcw,
      title: 'Adapt Techniques',
      text: 'Adjust methods to fit your style.'
    }
  ];

  const simplifiedTechniques = [
    {
      icon: Brain,
      title: 'CBT: Thought Record',
      summary: 'Identify and reframe negative thoughts.',
      steps: [
        'Write the triggering situation.',
        'Note your thoughts and emotions.',
        'Challenge and replace unhelpful thoughts.'
      ]
    },
    {
      icon: Leaf,
      title: 'Mindfulness: 4-7-8 Breathing',
      summary: 'Use breath to calm the mind.',
      steps: [
        'Inhale for 4 seconds.',
        'Hold for 7 seconds.',
        'Exhale for 8 seconds.'
      ]
    },
    {
      icon: Heart,
      title: 'Gratitude: 3 Good Things',
      summary: 'Reflect on the positives daily.',
      steps: [
        'Write 3 good things from today.',
        'Reflect on why they happened.',
        'Notice your emotional shift.'
      ]
    }
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">Quick Wellness Techniques</h1>
          <p className="text-lg text-gray-600">Simple tools to reset your mind and mood</p>
        </motion.div>

        {/* Breathing Exercise */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">4-7-8 Breathing</h2>
          <p className="text-gray-600 mb-6">Follow the rhythm to calm anxiety and enhance sleep.</p>
          <div className="flex flex-col items-center space-y-6">
            <div className={`w-32 h-32 rounded-full border-4 transition-all duration-1000 ${breathingPhase === 'inhale' ? 'border-primary-500 scale-110' : breathingPhase === 'hold' ? 'border-sage-500 scale-110' : 'border-warm-500 scale-90'}`}>              <div className="w-full h-full rounded-full bg-gradient-to-r from-primary-100 to-sage-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">{breathingCount}</div>
                  <div className="text-sm text-gray-500 capitalize">{breathingPhase}</div>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              {!activeBreathing ? (
                <button onClick={startBreathingExercise} className="btn-primary flex items-center space-x-2">
                  <Play className="h-5 w-5" /><span>Start</span>
                </button>
              ) : (
                <button onClick={stopBreathingExercise} className="btn-secondary flex items-center space-x-2">
                  <Pause className="h-5 w-5" /><span>Stop</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Highlight Techniques */}
        <div className="space-y-8">
          {simplifiedTechniques.map((tech, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.1 }} className="card">
              <div className="flex items-center mb-4">
                <tech.icon className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="text-xl font-semibold">{tech.title}</h3>
              </div>
              <p className="text-gray-600 mb-2">{tech.summary}</p>
              <ul className="list-disc list-inside text-gray-700 text-sm">
                {tech.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Quick Tips */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-16 bg-gradient-to-r from-primary-50 to-sage-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Quick Wellness Tips</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickTips.map((tip, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
                  <tip.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="font-semibold mb-1">{tip.title}</h3>
                <p className="text-sm text-gray-600">{tip.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Techniques;
