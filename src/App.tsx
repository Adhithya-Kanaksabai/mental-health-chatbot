import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from './components/Header'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Techniques from './pages/Techniques'
import Journal from './pages/Journal'
import Resources from './pages/Resources'
import { AnimatePresence } from 'framer-motion'



function App() {
  const location = useLocation();
  return (
    <div className="min-h-screen">
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="pt-20"
        >
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/techniques" element={<Techniques />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/resources" element={<Resources />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
    </div>
  )
}

export default App