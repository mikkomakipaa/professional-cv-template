import { useState } from 'react';
import './App.css';
import profilePhoto from './assets/chef-placeholder.jpg';

function ChatbotWidget({ alwaysOpen }) {
  const [_open, _setOpen] = useState(alwaysOpen || false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I\'m your Supreme Commander\'s digital assistant, here to explain my unnecessarily complicated culinary achievements and why everything I do is revolutionary (it isn\'t).' }
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
          assistant_id: 'asst_SAWgJNTGMIoidRR5FbUV4ATK'
        })
      });
      
      if (!runResponse.ok) {
        const errorData = await runResponse.json();
        console.error('Run creation failed:', errorData);
        throw new Error(`Failed to create run: ${errorData.error?.message || runResponse.statusText}`);
      }
      
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
        console.error('Assistant run failed:', run);
        const errorStatus = run.status || 'unknown';
        const errorDetails = run.last_error ? ` - ${run.last_error.message}` : '';
        setMessages(msgs => [...msgs, { sender: 'bot', text: `Assistant error: ${errorStatus}${errorDetails}. Please try again.` }]);
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
            <header className="mb-4 md:mb-16">
              <div className="flex flex-row items-start gap-3 md:gap-4 mb-8">
                {/* Professional Photo */}
                <div className="flex-shrink-0">
                  <img 
                    src={profilePhoto} 
                    alt="Alessandro Codibollo - Culinary Professional"
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-44 md:h-44 rounded-full border-2 md:border-4 border-white dark:border-gray-700 shadow-2xl ring-2 md:ring-4 ring-blue-100 dark:ring-blue-900/30 object-cover"
                  />
                </div>
                
                {/* Name and Title */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-1 md:mb-3 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent text-left leading-tight">
                    Alessandro Codibollo
                  </h1>
                  <p className="text-sm sm:text-base md:text-2xl text-gray-700 dark:text-gray-300 mb-4 md:mb-6 font-medium text-left leading-tight">
                    Maestro of Culinary Transformation & Digital Gastronomy
                  </p>
                  
                  {/* Compact Quick Facts */}
                  <div className="flex flex-wrap gap-x-8 gap-y-3 mb-4 text-sm">
                    <div className="text-left">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Experience</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">14+ Years</div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">Principal Culinary Consultant at EpicureanVault Group</div>
                    </div>
                  </div>
                  <div className="mb-6 text-sm">
                    <div className="text-left">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Open to</div>
                      <div className="font-semibold text-green-600 dark:text-green-400">Head Chaos Chef, Director of Culinary Overkill, Menu Architect and Innovation Lead</div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </header>

            {/* Main Content Sections */}
            <main className="space-y-4 md:space-y-20">
            
            {/* About me Timeline */}
            <section>
              <div className="mb-6 md:mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-left">
                  About me
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-8"></div>
              </div>
              
              {/* Career Progression Summary */}
              <div className="p-8 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">My 14+ years in Making Food a Bigger Deal Than It Needs to Be</h3>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Menu Visionary Extraordinaire</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">I don't just cook food; I "conceptualize edible experiences" that require a thesaurus to describe and three hours to serve.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Kitchen Portfolio Magnate</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Managing multiple restaurants at once so I can ignore them equally. I once had a dozen chefs on speed dial just to argue about parsley placement.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Gastro-Architectural Strategist</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Designed kitchens so futuristic that staff needed training just to boil water.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">4</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Transformation Guru</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Turned lasagna into a SaaS model: subscription layers, available in the cloud (literally, served on dry ice).</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Core Skills Section */}
            <section>
              <div className="mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-left">
                  Core Skills
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-8"></div>
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
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-left">Agile Menu Development</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-left">New gnocchi flavors released in two-week sprints. Master of iterative culinary development and continuous improvement of pasta shapes.</p>
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
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-left">Restaurant Expansion Program Management</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-left">Think global domination, but with soup. Strategic scaling of dining concepts across impossible locations and improbable market conditions.</p>
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
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-left">IoT Gastronomy</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-left">Every fork is smart, every plate reports KPI data. Pioneering the convergence of culinary arts and Internet of Things technology for data-driven dining experiences.</p>
                      </div>
                    </div>
                  </div>

                  {/* Leadership */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-left">Leadership</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-left">Motivating teams through confusing metaphors and expensive aprons. Expert in culinary team management using breakthrough motivational techniques and premium uniform strategies.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-left">
                  Select "Achievements"
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-8"></div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Customer Satisfaction */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-left">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Platinum Ladle Award</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Pretentious Excellence</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">For inventing a dessert so over-complicated it required a project manager</div>
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400">EpicureanVault Group</div>
                    </div>
                  </div>

                  {/* IT Cost Optimization */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-left">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">42% Efficiency Gain</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Table Turnover Innovation</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Removed chairs from the restaurant so tables turned faster</div>
                      <div className="text-xs font-medium text-purple-600 dark:text-purple-400">NexusCore Dining</div>
                    </div>
                  </div>

                  {/* Global Platform Rollout */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-left">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">18,500 Guests Served</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Pop-up Empire Expansion</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Across nine countries in my pop-up empire; most were just lost tourists</div>
                      <div className="text-xs font-medium text-green-600 dark:text-green-400">QuantumFeast Kitchens</div>
                    </div>
                  </div>

                  {/* Product Leadership */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-left">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">11 Signature Menus</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Creative Redundancy</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">All featuring the same truffle oil, but described differently</div>
                      <div className="text-xs font-medium text-green-600 dark:text-green-400">QuantumFeast Kitchens</div>
                    </div>
                  </div>

                  {/* Process Automation */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-left">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">83% Kitchen Automation</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Digital Innovation</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Taught a blender to tweet</div>
                      <div className="text-xs font-medium text-green-600 dark:text-green-400">QuantumFeast Kitchens</div>
                    </div>
                  </div>

                  {/* Rapid ROI */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-left">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">&lt;8 Months ROI</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Accidental Success</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Restaurant profitable after accidentally serving the wrong bill to a billionaire</div>
                      <div className="text-xs font-medium text-green-600 dark:text-green-400">QuantumFeast Kitchens</div>
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
                  {/* EpicureanVault Group - Principal Culinary Consultant */}
                  <div className="relative flex items-center gap-6 md:gap-8">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Principal Culinary Consultant</h3>
                          <p className="text-blue-600 dark:text-blue-400 font-medium">EpicureanVault Group</p>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            Current Role
                          </span>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span>Mar 2020 - Present</span>
                            <span className="block md:inline md:ml-2 text-xs text-gray-500 dark:text-gray-500">(4 years, 10 months)</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-left">
                        Designs absurdly complicated dining concepts for cruise ships, mountaintops, and anywhere normal people can't get to. Introduced $500 "dehydrated water" as a menu item.
                      </p>
                    </div>
                  </div>

                  {/* NexusCore Dining - Head Chaos Chef */}
                  <div className="relative flex items-center gap-6 md:gap-8">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-full border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Head Chaos Chef</h3>
                          <p className="text-purple-600 dark:text-purple-400 font-medium">NexusCore Dining</p>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span>Aug 2018 - Feb 2020</span>
                          <span className="block md:inline md:ml-2 text-xs text-gray-500 dark:text-gray-500">(1 year, 7 months)</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-left">
                        Turned a family diner into a "micro-gastro experience hub" with 9-course breakfasts. Increased costs dramatically, but convinced customers it was art.
                      </p>
                    </div>
                  </div>

                  {/* NexusCore Dining - Menu Architect */}
                  <div className="relative flex items-center gap-6 md:gap-8">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-400 rounded-full border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menu Architect</h3>
                          <p className="text-purple-600 dark:text-purple-400 font-medium">NexusCore Dining</p>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span>Jun 2018 - Jul 2018</span>
                          <span className="block md:inline md:ml-2 text-xs text-gray-500 dark:text-gray-500">(2 months)</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-left">
                        Created a menu layout shaped like a swan. Waiters hated it.
                      </p>
                    </div>
                  </div>

                  {/* QuantumFeast Kitchens - Director of Culinary Overkill */}
                  <div className="relative flex items-center gap-6 md:gap-8">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Director of Culinary Overkill</h3>
                          <p className="text-green-600 dark:text-green-400 font-medium">QuantumFeast Kitchens</p>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span>Sep 2012 - May 2018</span>
                          <span className="block md:inline md:ml-2 text-xs text-gray-500 dark:text-gray-500">(5 years, 9 months)</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-left">
                        Installed a waterfall in the dining room to "enhance soup appreciation." Trained chefs to narrate the cooking process in haiku form.
                      </p>
                    </div>
                  </div>

                  {/* QuantumFeast Kitchens - Innovation Lead */}
                  <div className="relative flex items-center gap-6 md:gap-8">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Innovation Lead</h3>
                          <p className="text-green-600 dark:text-green-400 font-medium">QuantumFeast Kitchens</p>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span>Jan 2011 - Aug 2012</span>
                          <span className="block md:inline md:ml-2 text-xs text-gray-500 dark:text-gray-500">(1 year, 8 months)</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-left">
                        Invented glow-in-the-dark sushi for "nighttime fine dining experiences." Health inspectors were… unconvinced.
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
                  href="mailto:alessandro.codibollo@example.com?subject=Culinary Opportunity&body=Hi Alessandro,%0D%0A%0D%0AI'd like to discuss a potential culinary opportunity with you.%0D%0A%0D%0ABest regards"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Me
                </a>
                
                <a 
                  href="https://www.linkedin.com/in/alessandrocodibollo" 
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
                  href="https://calendly.com/alessandrocodibollo" 
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-6 text-center">
                Note: Professional email contact for inquiries and opportunities.
              </p>
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
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4 flex items-center justify-center flex-wrap">
            <span>Vibe coding experiment using Claude Code, OpenAI, GitHub and Vercel.</span>
            <a 
              href="https://github.com/mikkomakipaa/professional-cv-template" 
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
