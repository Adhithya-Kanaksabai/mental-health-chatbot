import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MessageCircle,
  BookOpen,
  PenTool,
  Lightbulb,
  Heart,
  Shield,
  Users
} from 'lucide-react'


const Home = () => {
  const features = [
    {
      icon: MessageCircle,
      title: 'Supportive Chat',
      description: 'Get compassionate, evidence-based guidance whenever you need it',
      link: '/chat',
      color: 'from-primary-500 to-primary-600'
    },
    {
      icon: Lightbulb,
      title: 'Wellness Techniques',
      description: 'Learn practical coping strategies from CBT, mindfulness, and more',
      link: '/techniques',
      color: 'from-sage-500 to-sage-600'
    },
    {
      icon: PenTool,
      title: 'Personal Journal',
      description: 'Reflect and track your emotional journey with guided prompts',
      link: '/journal',
      color: 'from-warm-500 to-warm-600'
    },
    {
      icon: BookOpen,
      title: 'Resources',
      description: 'Access helpful articles, emergency contacts, and professional support',
      link: '/resources',
      color: 'from-purple-500 to-purple-600'
    }
  ]

  const values = [
    {
      icon: Heart,
      title: 'Compassionate Support',
      description: 'Non-judgmental, warm guidance that validates your feelings'
    },
    {
      icon: Shield,
      title: 'Safe & Private',
      description: 'Your privacy is protected with secure, confidential interactions'
    },
    {
      icon: Users,
      title: 'Culturally Aware',
      description: 'Incorporating both Western and Indian perspectives on wellness'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-vibrant-50 via-pink-50 to-yellow-100">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-vibrant-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent animate-slide-fade">
              Your Journey to{' '}
              <span className="bg-gradient-to-r from-pink-500 via-yellow-500 to-vibrant-500 bg-clip-text text-transparent animate-bounce-in">Mental Wellness</span>{' '}
              Starts Here
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in">
              Get compassionate support and evidence-based techniques for emotional well-being. 
              We're here to guide you with warmth, understanding, and practical tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/chat" className="btn-primary animate-bounce-in" aria-label="Start chat">
                Start Your Support Chat
              </Link>
              <Link to="/techniques" className="btn-secondary animate-bounce-in" aria-label="Explore techniques">
                Explore Techniques
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-yellow-50 via-white to-pink-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 bg-gradient-to-r from-vibrant-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent animate-slide-fade">
              How We Support You
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in">
              Discover the tools and resources designed to help you navigate life's challenges 
              with confidence and resilience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  whileHover={{ scale: 1.08 }}
                  className="hover:shadow-xl transition-shadow duration-300"
                >
                  <Link to={feature.link} className="block group" aria-label={`Go to ${feature.title}`}>
                    <div className="card hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-vibrant-100 via-pink-50 to-yellow-50 animate-fade-in">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 animate-bounce-in`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-vibrant-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50 via-yellow-50 to-vibrant-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 bg-gradient-to-r from-vibrant-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent animate-slide-fade">
              Our Commitment to You
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in">
              Built on principles of compassion, safety, and cultural understanding.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + 0.1 * index }}
                  whileHover={{ scale: 1.08 }}
                  className="text-center hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-vibrant-100 via-pink-100 to-yellow-100 flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                    <Icon className="h-8 w-8 text-vibrant-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-vibrant-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent animate-slide-fade">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed animate-fade-in">
                    {value.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-vibrant-600 via-pink-500 to-yellow-500 animate-fade-in">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6 animate-slide-fade">
              Ready to Begin Your Wellness Journey?
            </h2>
            <p className="text-xl text-yellow-100 mb-8 max-w-2xl mx-auto animate-fade-in">
              Take the first step towards better mental health. We're here to support you 
              every step of the way.
            </p>
            <Link 
              to="/chat"
              className="inline-block bg-white text-vibrant-600 font-semibold py-4 px-8 rounded-xl hover:bg-gray-50 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              aria-label="Start your chat now"
            >
              Start Your Support Chat Now
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home
