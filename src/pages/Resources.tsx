import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Phone, MessageCircle, Globe, Book, Users, AlertTriangle, ExternalLink, Heart } from 'lucide-react'
import { fetchCrisisContext, localeHint } from '../services/aiServices'
import type { CrisisResource } from '@shared/protocol'

interface Helpline {
  name: string
  number: string
  description: string
  type: 'Crisis' | 'Support'
  /** Stated plainly: someone calling at 2am needs to know if nobody answers. */
  hours: string
  source: string
}

const Resources = () => {
  // The banner and the default tab both follow the viewer's region rather than
  // assuming the US. Resolved server-side from time zone, same as the chat page.
  const [region, setRegion] = useState<string>('INTL')
  const [bannerResources, setBannerResources] = useState<CrisisResource[]>([])
  const [selectedTab, setSelectedTab] = useState('emergency')
  const [tabTouched, setTabTouched] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchCrisisContext(localeHint()).then((ctx) => {
      if (cancelled) return
      setRegion(ctx.region)
      setBannerResources(ctx.resources)
      // Do not yank the tab out from under someone who already picked one.
      if (!tabTouched && ctx.region === 'IN') setSelectedTab('india')
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectTab = (value: string) => {
    setTabTouched(true)
    setSelectedTab(value)
  }

  // Verified 2026-09-12. Re-check against the source column before each release.
  const emergencyContacts: Helpline[] = [
    { name: '988 Suicide & Crisis Lifeline', number: '988', description: 'Call or text 988 for suicidal thoughts or emotional distress', type: 'Crisis', hours: '24/7', source: 'https://988lifeline.org/' },
    { name: 'Crisis Text Line', number: 'Text HOME to 741741', description: 'Crisis support via text message (AYUDA for Spanish)', type: 'Crisis', hours: '24/7', source: 'https://www.crisistextline.org/' },
    { name: 'SAMHSA National Helpline', number: '1-800-662-4357', description: 'Treatment referral and information service', type: 'Support', hours: '24/7', source: 'https://www.samhsa.gov/find-help/national-helpline' },
    { name: 'National Domestic Violence Hotline', number: '1-800-799-7233', description: 'Support for domestic violence situations', type: 'Crisis', hours: '24/7', source: 'https://www.thehotline.org/' }
  ]

  const indianResources: Helpline[] = [
    { name: 'Tele-MANAS', number: '14416', description: "India's national mental health helpline, from the Ministry of Health. Also 1-800-891-4416", type: 'Crisis', hours: '24/7, free, 20 languages', source: 'https://telemanas.mohfw.gov.in/' },
    { name: 'Vandrevala Foundation', number: '1860-266-2345 / 9999-666-555', description: 'Free and confidential crisis intervention by phone and chat', type: 'Support', hours: '24/7', source: 'https://www.vandrevalafoundation.com/free-counseling/contact-us' },
    { name: 'Sneha India', number: '044-24640050', description: 'Suicide prevention helpline based in Chennai', type: 'Crisis', hours: '24/7', source: 'https://snehaindia.org/' },
    { name: 'iCall (TISS)', number: '9152987821', description: 'Psychosocial helpline run by the Tata Institute of Social Sciences', type: 'Support', hours: 'Mon-Sat, 8am-10pm (not 24/7)', source: 'https://icallhelpline.org/' }
  ]

  const onlineResources = [
    { title: 'Find a Helpline', url: 'https://findahelpline.com', description: 'Verified crisis lines in over 130 countries', icon: Globe },
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

  const renderHelpline = (c: Helpline, i: number) => (
    <div key={i} className="card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-lg">{c.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${c.type === 'Crisis' ? 'bg-red-50 text-red-700' : 'bg-sage-50 text-sage-700'}`}>
          {c.type}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-1">{c.description}</p>
      <p className="font-mono text-primary-600">{c.number}</p>
      <p className="text-xs text-gray-500 mt-1">
        {c.hours}
        <a href={c.source} target="_blank" rel="noreferrer" className="ml-2 underline inline-flex items-center">
          source <ExternalLink className="w-3 h-3 ml-0.5" />
        </a>
      </p>
    </div>
  )

  const crisisAlert = (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
      <div className="flex items-start">
        <AlertTriangle className="h-6 w-6 text-red-500 mr-3 mt-1 flex-shrink-0" />
        <div>
          <p className="text-red-800 font-semibold">In crisis? Reach out now:</p>
          <div className="flex flex-col text-sm mt-2 text-red-700 space-y-1">
            {bannerResources.length > 0 ? (
              bannerResources.map((r) => (
                <span key={r.name}>
                  {r.method === 'text' ? (
                    <MessageCircle className="inline w-4 h-4 mr-1" />
                  ) : (
                    <Phone className="inline w-4 h-4 mr-1" />
                  )}
                  {r.method === 'text' ? 'Text ' : ''}
                  <span className="font-semibold">{r.contact}</span> &mdash; {r.name}
                </span>
              ))
            ) : (
              <span>
                <Globe className="inline w-4 h-4 mr-1" />
                Contact your local emergency services, or find a verified line for
                your country at findahelpline.com
              </span>
            )}
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

        <Tabs value={selectedTab} onValueChange={selectTab} className="mb-8">
          <TabsList className="flex flex-wrap gap-2 justify-center">
            <TabsTrigger value="emergency">🆘 US</TabsTrigger>
            <TabsTrigger value="india">🇮🇳 India</TabsTrigger>
            <TabsTrigger value="online">🌐 Online</TabsTrigger>
            <TabsTrigger value="self">💖 Self-Care</TabsTrigger>
          </TabsList>

          <TabsContent value="emergency">
            <div className="space-y-4">{emergencyContacts.map(renderHelpline)}</div>
          </TabsContent>

          <TabsContent value="india">
            <div className="space-y-4">{indianResources.map(renderHelpline)}</div>
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
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-primary-600 text-sm flex items-center">
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

        {region !== 'IN' && region !== 'US' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 mb-4"
          >
            These lists cover India and the United States. For anywhere else, the
            Online tab links to a directory of verified crisis lines in over 130
            countries.
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-50 border border-primary-200 rounded-xl p-6 text-sm text-primary-800"
        >
          <p className="font-medium mb-2">💬 Not sure where to start?</p>
          <p>Use the chat to describe how you're feeling, and it can point you toward the right resource.</p>
        </motion.div>
      </div>
    </div>
  )
}

export default Resources
