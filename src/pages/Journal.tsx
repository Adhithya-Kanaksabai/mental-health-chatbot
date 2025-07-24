import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PenTool, Calendar, Trash2, Plus, BookOpen } from 'lucide-react'

interface JournalEntry {
  id: string
  date: string
  mood: number
  title: string
  content: string
  gratitude: string[]
  prompt: string
}

const Journal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [currentEntry, setCurrentEntry] = useState<Partial<JournalEntry>>({
    mood: 5,
    title: '',
    content: '',
    gratitude: ['', '', ''],
    prompt: ''
  })

  const prompts = [
    "What am I grateful for today?",
    "What challenged me today and how did I handle it?",
    "What would I tell my younger self about today?",
    "What small victory can I celebrate today?",
    "How did I show kindness to myself or others today?",
    "What did I learn about myself today?",
    "What emotions did I experience today and why?",
    "What would make tomorrow even better?",
    "How did I grow or change today?",
    "What brought me peace or joy today?"
  ]

  useEffect(() => {
    const saved = localStorage.getItem('journalEntries')
    if (saved) setEntries(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('journalEntries', JSON.stringify(entries))
  }, [entries])

  const getRandomPrompt = () => prompts[Math.floor(Math.random() * prompts.length)]

  const startNewEntry = () => {
    setCurrentEntry({
      mood: 5,
      title: '',
      content: '',
      gratitude: ['', '', ''],
      prompt: getRandomPrompt()
    })
    setShowNewEntry(true)
  }

  const saveEntry = () => {
    if (!currentEntry.title || !currentEntry.content) return

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood: currentEntry.mood || 5,
      title: currentEntry.title || '',
      content: currentEntry.content || '',
      gratitude: currentEntry.gratitude || ['', '', ''],
      prompt: currentEntry.prompt || ''
    }

    setEntries(prev => [newEntry, ...prev])
    setShowNewEntry(false)
  }

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const getMoodEmoji = (mood: number) => {
    const emojis = ['😢', '😔', '😐', '🙂', '😊', '😄', '🤗', '😍', '🥳', '✨']
    return emojis[mood - 1] || '😐'
  }

  const getMoodColor = (mood: number) => {
    if (mood <= 3) return 'text-red-500'
    if (mood <= 5) return 'text-yellow-500'
    if (mood <= 7) return 'text-green-500'
    return 'text-blue-500'
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-warm-500 to-primary-500 rounded-full">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold gradient-text mb-4">Personal Journal</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Reflect on your thoughts, track your mood, and practice gratitude</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <button onClick={startNewEntry} className="btn-primary flex items-center space-x-2 mx-auto">
            <Plus className="h-5 w-5" />
            <span>New Journal Entry</span>
          </button>
        </motion.div>

        {showNewEntry && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mb-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <PenTool className="h-6 w-6 mr-2 text-primary-600" />
              New Entry
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling today? (1-10)</label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentEntry.mood}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, mood: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <div className="flex items-center space-x-2">
                  <span className={`text-2xl ${getMoodColor(currentEntry.mood || 5)}`}>
                    {getMoodEmoji(currentEntry.mood || 5)}
                  </span>
                  <span className="font-medium">{currentEntry.mood}/10</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Entry Title</label>
              <input
                type="text"
                value={currentEntry.title}
                onChange={(e) => setCurrentEntry(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Give your entry a title..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {currentEntry.prompt && (
              <div className="mb-6 p-4 bg-primary-50 rounded-lg">
                <h3 className="font-medium text-primary-800 mb-2">Today's Reflection Prompt:</h3>
                <p className="text-primary-700">{currentEntry.prompt}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Thoughts</label>
              <textarea
                value={currentEntry.content}
                onChange={(e) => setCurrentEntry(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write about your day, feelings, or thoughts..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Three Things I'm Grateful For</label>
              <div className="space-y-2">
                {currentEntry.gratitude?.map((item, index) => (
                  <input
                    key={index}
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...(currentEntry.gratitude || ['', '', ''])]
                      updated[index] = e.target.value
                      setCurrentEntry(prev => ({ ...prev, gratitude: updated }))
                    }}
                    placeholder={`Gratitude ${index + 1}`}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button onClick={saveEntry} disabled={!currentEntry.title || !currentEntry.content} className="btn-primary disabled:opacity-50">
                Save Entry
              </button>
              <button onClick={() => setShowNewEntry(false)} className="btn-secondary">Cancel</button>
            </div>
          </motion.div>
        )}

        {/* Entries */}
        <div className="space-y-6">
          {entries.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-500 mb-2">No entries yet</h3>
              <p className="text-gray-400">Start your journaling journey by creating your first entry</p>
            </motion.div>
          ) : (
            entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className={`text-lg ${getMoodColor(entry.mood)}`}>{getMoodEmoji(entry.mood)}</span>
                      <span className="text-sm text-gray-500">{entry.mood}/10</span>
                    </div>
                  </div>
                  <button onClick={() => deleteEntry(entry.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h3 className="text-xl font-semibold mb-3">{entry.title}</h3>

                {entry.prompt && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 italic">"{entry.prompt}"</p>
                  </div>
                )}

                <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-line">{entry.content}</p>

                {entry.gratitude.some(g => g.trim()) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-2">Gratitude:</h4>
                    <ul className="space-y-1">
                      {entry.gratitude.filter(g => g.trim()).map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center">
                          <span className="text-warm-500 mr-2">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Journal
