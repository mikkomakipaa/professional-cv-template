import { useState } from 'react';
import './App.css';
import profilePhoto from './assets/mikkomakipaa.jpg';

function ChatbotWidget({ alwaysOpen }) {
  const [_open, _setOpen] = useState(alwaysOpen || false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I\'m Mikko\'s career sidekick that answers recruiter questions with facts from my own work history — no fluff, no guesswork.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setMessages([...messages, { sender: 'user', text: input }, { sender: 'bot', text: 'Please configure VITE_OPENAI_API_KEY environment variable to enable chat functionality.' }]);
      setInput('');
      return;
    }
    
    const userMessage = input;
    setMessages([...messages, { sender: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);
    
    try {
      // Step 1: Create thread if it doesn't exist
      let currentThreadId = threadId;
      if (!currentThreadId) {
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({})
        });
        const threadData = await threadResponse.json();
        currentThreadId = threadData.id;
        setThreadId(currentThreadId);
      }

      // Step 2: Add message to thread
      await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          role: 'user',
          content: userMessage
        })
      });

      // Step 3: Create and run assistant
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: 'asst_GpfPbiGFCD0GFwllfoaLQ2FA'
        })
      });
      const runData = await runResponse.json();

      // Step 4: Poll for completion
      let run = runData;
      while (run.status === 'queued' || run.status === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${run.id}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });
        run = await statusResponse.json();
      }

      if (run.status === 'completed') {
        // Step 5: Get messages
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages?order=desc&limit=1`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });
        const messagesData = await messagesResponse.json();
        const latestMessage = messagesData.data[0];
        const botReply = latestMessage.content[0].text.value;
        
        setMessages(msgs => [...msgs, { sender: 'bot', text: botReply }]);
      } else {
        setMessages(msgs => [...msgs, { sender: 'bot', text: `Assistant error: ${run.status}. Please try again.` }]);
      }
      
    } catch (err) {
      console.error('Assistant API Error:', err);
      const errorMsg = err.message.includes('fetch') ? 'Network error. Please check your connection.' : 'Error contacting OpenAI Assistant API.';
      setMessages(msgs => [...msgs, { sender: 'bot', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  // Always open in split layout
  if (alwaysOpen) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ask Me Anything</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-blue-50/30 to-white dark:from-gray-900/50 dark:to-gray-900 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`text-${msg.sender === 'user' ? 'right' : 'left'} mb-3`}>
              <span className={`inline-block rounded-2xl px-4 py-3 max-w-xs shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-blue-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
              }`}>
                {msg.text}
              </span>
            </div>
          ))}
          {loading && (
            <div className="text-left mb-3">
              <span className="inline-block rounded-2xl px-4 py-3 bg-blue-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={loading}
            />
            <button 
              onClick={handleSend} 
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 disabled:opacity-50 hover:shadow-lg flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              <span className="hidden sm:block">{loading ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: floating button (not used in split layout)
  return null;
}

function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <ChatbotWidget alwaysOpen={true} />
        </div>
      )}
      
      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center group"
        aria-label="Open Chat"
      >
        {isOpen ? (
          <svg className="w-8 h-8 transform group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <svg className="w-8 h-8 transform group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        )}
      </button>
      
      {/* Tooltip */}
      {!isOpen && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Ask me anything about my career!
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Main Content Area */}
      <div className="container mx-auto max-w-4xl px-8 md:px-16 lg:px-32 xl:px-40 py-8">
            {/* Header Section */}
            <header className="mb-16">
              <div className="flex flex-col md:flex-row md:items-start gap-8 mb-8">
                {/* Professional Photo */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <img 
                    src={profilePhoto} 
                    alt="Mikko Makipaa - Professional Photo"
                    className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white dark:border-gray-700 shadow-2xl ring-4 ring-blue-100 dark:ring-blue-900/30 object-cover"
                  />
                </div>
                
                {/* Name and Title */}
                <div className="flex-1 text-left">
                  <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent text-left">
                    Mikko Mäkipää
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-6 font-medium text-left">
                    Transformation programs and projects
                  </p>
                  
                  {/* Compact Quick Facts */}
                  <div className="flex flex-wrap gap-x-8 gap-y-3 mb-6 text-sm">
                    <div className="text-left">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Experience</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">17+ Years</div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">Sofigate</div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Location</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">Finland</div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Available</div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="font-semibold text-green-600 dark:text-green-400 text-xs">Yes</div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </header>

            {/* Main Content Sections */}
            <main className="space-y-20">
            {/* Professional Overview Section */}
            <section>
              <div className="mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-left">
                  Professional Overview
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-8"></div>
              </div>
              <div className="mb-12">
                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 text-left">
                  Senior technology executive with 17+ years leading enterprise transformation initiatives. Proven track record delivering measurable results: 70% cost reductions, 27% IT optimization, and profitable platform launches. Specializes in complex, multi-stakeholder environments requiring structured governance and stakeholder alignment.
                </p>
              </div>

              {/* Core Skills Section - moved above achievements */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100 text-left">Core Skills</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                  {/* Development Management */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Development Management</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">End-to-end transformation program leadership from concept to delivery. Specializes in greenfield initiatives and building scalable solutions from ground up across enterprise environments.</p>
                      </div>
                    </div>
                  </div>

                  {/* Program and Project Management */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Program and Project Management</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Portfolio leadership spanning multi-year enterprise programs and 30+ strategic IT initiatives. Expert in pioneering first-of-kind solutions with comprehensive business case development and stakeholder alignment.</p>
                      </div>
                    </div>
                  </div>

                  {/* Product & Process Development */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Product & Process Development</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">International product portfolio leadership across seven enterprise solutions. Drives operational excellence through process automation and optimization, delivering significant efficiency gains and profitability improvements in high-sensitivity environments.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-left">
                <h3 className="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100">Impact Metrics</h3>
                <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
                  {/* Financial Impact */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-left">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">70%</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Cost Reduction</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Process Automation</div>
                    </div>
                  </div>

                  {/* Scale Impact */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-left">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">12K+</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Global Users</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">7 Countries</div>
                    </div>
                  </div>

                  {/* Portfolio Impact */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-left">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">30+</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Strategic Programs</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Multi-year initiatives</div>
                    </div>
                  </div>
                </div>
              </div>
              
            </section>


            {/* Work Experience Section */}
            <section>
              <div className="mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-left">
                  Work Experience
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-8"></div>
              </div>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500"></div>
                
                {/* Timeline Items */}
                <div className="space-y-8">
                  {/* Sofigate - Current */}
                  <div className="relative flex items-center gap-6 md:gap-8">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Senior Advisor</h3>
                          <p className="text-blue-600 dark:text-blue-400 font-medium">Sofigate</p>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            Current Role
                          </span>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span>Oct 2019 - Present</span>
                            <span className="block md:inline md:ml-2 text-xs text-gray-500 dark:text-gray-500">(5 years, 3 months)</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        External consulting leadership for enterprise clients across platform migrations, ICT renewals, and ERP transitions. Specializes in multi-vendor environment optimization and structured governance frameworks that align technology investments with strategic business objectives.
                      </p>
                    </div>
                  </div>

                  {/* RSM Finland - Interim CIO */}
                  <div className="relative flex items-center gap-6 md:gap-8">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-full border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Interim CIO</h3>
                          <p className="text-purple-600 dark:text-purple-400 font-medium">RSM Finland</p>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span>Jan 2018 - Oct 2019</span>
                          <span className="block md:inline md:ml-2 text-xs text-gray-500 dark:text-gray-500">(1 year, 9 months)</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        Cloud transformation executive for mid-market audit firm. Delivered comprehensive IT modernization including cost optimization, enhanced collaboration frameworks, and enterprise security architecture. Achieved 27% cost reduction while improving user satisfaction.
                      </p>
                    </div>
                  </div>

                  {/* RSM Finland - Enterprise Architect */}
                  <div className="relative flex items-center gap-6 md:gap-8">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-400 rounded-full border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Enterprise Architect</h3>
                          <p className="text-purple-600 dark:text-purple-400 font-medium">RSM Finland</p>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span>Nov 2018 - Dec 2018</span>
                          <span className="block md:inline md:ml-2 text-xs text-gray-500 dark:text-gray-500">(2 months)</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        Strategic IT architecture assessment and roadmap development. Created comprehensive enterprise architecture blueprint including current-state analysis, future-state design, and implementation pathway for organizational transformation.
                      </p>
                    </div>
                  </div>

                  {/* Accountor - Development Manager */}
                  <div className="relative flex items-center gap-6 md:gap-8">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Development Manager</h3>
                          <p className="text-green-600 dark:text-green-400 font-medium">Accountor</p>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span>May 2010 - Nov 2018</span>
                          <span className="block md:inline md:ml-2 text-xs text-gray-500 dark:text-gray-500">(8 years, 7 months)</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        Portfolio leadership for international product development and process optimization. Key achievements: global service portal serving 12,000+ customers across 7 countries, financial platform achieving profitability within 12 months, 70% cost reduction through payment automation, and successful delivery of 25+ strategic IT initiatives spanning architecture, data, and digital transformation.
                      </p>
                    </div>
                  </div>

                  {/* Accountor - Product Manager */}
                  <div className="relative flex items-center gap-6 md:gap-8">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Product Manager</h3>
                          <p className="text-green-600 dark:text-green-400 font-medium">Accountor</p>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span>Oct 2008 - Apr 2010</span>
                          <span className="block md:inline md:ml-2 text-xs text-gray-500 dark:text-gray-500">(1 year, 7 months)</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        Product strategy and lifecycle management for enterprise travel and expense management platform.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* Call-to-Action Section */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 mb-12 md:mb-12 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Ready to Connect?</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <a 
                  href="mailto:pass_me_mail.corned865@passmail.net?subject=Job Opportunity&body=Hi Mikko,%0D%0A%0D%0AI'd like to discuss a potential opportunity with you.%0D%0A%0D%0ABest regards"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Me
                </a>
                
                <a 
                  href="https://www.linkedin.com/in/mikkomakipaa" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                  </svg>
                  LinkedIn Profile
                </a>
                
                <a 
                  href="https://outlook.office.com/bookwithme/user/b93bd784727b4f20a4d07114b34e7df6@sofigate.com?anonymous&ep=plink" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 border-2 border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Book a meeting
                </a>
              </div>
            </div>
            </main>
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <FloatingChatWidget />
      </div>
      
      {/* Footer */}
      <footer className="w-full mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
            Vibe coding experiment using Claude Code, OpenAI, GitHub and Vercel. 
            <a 
              href="https://github.com/mikkomakipaa/professional-cv-website" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View Source
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
