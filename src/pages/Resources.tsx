import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Phone, MessageCircle, Globe, Book, Users, AlertTriangle, ExternalLink, Heart } from 'lucide-react'

const Resources = () => {
  const [selectedTab, setSelectedTab] = useState('emergency')

  const emergencyContacts = [
    { name: 'National Suicide Prevention Lifeline', number: '988', description: '24/7 crisis support for suicidal thoughts', type: 'Crisis' },
    { name: 'Crisis Text Line', number: 'Text HOME to 741741', description: '24/7 crisis support via text message', type: 'Crisis' },
    { name: 'SAMHSA National Helpline', number: '1-800-662-4357', description: 'Treatment referral and information service', type: 'Support' },
    { name: 'National Domestic Violence Hotline', number: '1-800-799-7233', description: '24/7 support for domestic violence situations', type: 'Crisis' }
  ]

  const indianResources = [
    { name: 'Vandrevala Foundation', number: '1860-2662-345', description: '24/7 mental health helpline in India', type: 'Support' },
    { name: 'iCall', number: '9152987821', description: 'Psychosocial helpline by TISS', type: 'Support' },
    { name: 'Sneha India', number: '044-24640050', description: 'Suicide prevention helpline', type: 'Crisis' },
    { name: 'Mann Talks', number: '8686139139', description: 'Mental health support in multiple languages', type: 'Support' }
  ]

  const onlineResources = [
    { title: 'National Institute of Mental Health (NIMH)', url: 'https://www.nimh.nih.gov', description: 'Comprehensive mental health information and research', icon: Globe },
    { title: 'Mental Health America', url: 'https://www.mhanational.org', description: 'Mental health screening tools and resources', icon: Heart },
    { title: 'Anxiety and Depression Association', url: 'https://adaa.org', description: 'Resources for anxiety and depression management', icon: Users },
    { title: 'Headspace', url: 'https://www.headspace.com', description: 'Guided meditation and mindfulness app', icon: Book }
  ]

  const selfCareTips = [
    'Maintain a regular sleep schedule (7-9 hours)',
    'Eat nutritious meals at regular times',
    'Exercise for at least 30 minutes daily',
    'Practice deep breathing or meditation',
    'Limit alcohol and avoid drugs',
    'Stay connected with supportive people'
  ]

  const crisisAlert = (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
      <div className="flex items-start">
        <AlertTriangle className="h-6 w-6 text-red-500 mr-3 mt-1" />
        <div>
          <p className="text-red-800 font-semibold">In crisis? Reach out now:</p>
          <div className="flex flex-col text-sm mt-2 text-red-700 space-y-1">
            <span><Phone className="inline w-4 h-4 mr-1" />Call 988</span>
            <span><MessageCircle className="inline w-4 h-4 mr-1" />Text HOME to 741741</span>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-center mb-4"
        >
          Mental Health Resources
        </motion.h1>

        {crisisAlert}

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="flex flex-wrap gap-2 justify-center">
            <TabsTrigger value="emergency">🆘 Emergency</TabsTrigger>
            <TabsTrigger value="india">🇮🇳 India</TabsTrigger>
            <TabsTrigger value="online">🌐 Online</TabsTrigger>
            <TabsTrigger value="self">💖 Self-Care</TabsTrigger>
          </TabsList>

          <TabsContent value="emergency">
            <div className="space-y-4">
              {emergencyContacts.map((c, i) => (
                <div key={i} className="card">
                  <h3 className="font-semibold text-lg">{c.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">{c.description}</p>
                  <p className="font-mono text-primary-600">{c.number}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="india">
            <div className="space-y-4">
              {indianResources.map((c, i) => (
                <div key={i} className="card">
                  <h3 className="font-semibold text-lg">{c.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">{c.description}</p>
                  <p className="font-mono text-sage-600">{c.number}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="online">
            <div className="space-y-4">
              {onlineResources.map((r, i) => (
                <div key={i} className="card flex items-start space-x-4">
                  <div className="bg-gray-100 p-3 rounded">
                    <r.icon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="text-sm text-gray-600 mb-1">{r.description}</p>
                    <a href={r.url} target="_blank" className="text-primary-600 text-sm flex items-center">
                      Visit <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="self">
            <div className="space-y-3">
              {selfCareTips.map((tip, i) => (
                <div key={i} className="card text-sm text-gray-700">
                  <span className="text-pink-500 mr-2">💡</span>{tip}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Bonus: GPT Suggestion Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-50 border border-primary-200 rounded-xl p-6 text-sm text-primary-800"
        >
          <p className="font-medium mb-2">💬 Not sure where to start?</p>
          <p>Use our chatbot to describe how you're feeling. We'll suggest resources based on your mood and needs.</p>
        </motion.div>
      </div>
    </div>
  )
}

export default Resources
