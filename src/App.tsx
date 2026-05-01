import { useState, useEffect, useRef } from 'react';
import { 
  Send, Image as ImageIcon, File, Mic, Smile, MoreVertical, 
  Search, Phone, Video, Paperclip, ChevronLeft, Volume2, VolumeX,
  X, PenTool, Sparkles, GraduationCap, HelpCircle, Share2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Message, User, ChatMode, AppState } from './types';
import { GeminiService } from './lib/gemini';
import Auth from './components/Auth';
import ChatBubble from './components/ChatBubble';
import DrawingCanvas from './components/DrawingCanvas';
import Settings from './components/Settings';
import CallOverlay from './components/CallOverlay';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('zoya_app_state');
    const initial = saved ? JSON.parse(saved) : {
      messages: [],
      mode: 'normal' as ChatMode,
      isTyping: false,
      user: null,
      apiKey: process.env.GEMINI_API_KEY || '',
      isDarkMode: false,
      zoyaAvatar: 'https://ui-avatars.com/api/?name=Zoya&background=075E54&color=fff',
      notificationSound: true
    };
    
    // Fallback to environment variable if saved state is missing the key
    if (saved && initial && (!initial.apiKey || initial.apiKey === 'MY_GEMINI_API_KEY')) {
      initial.apiKey = process.env.GEMINI_API_KEY || '';
    }
    
    return initial;
  });

  const [inputMsg, setInputMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPaperclip, setShowPaperclip] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [activeCall, setActiveCall] = useState<'audio' | 'video' | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('zoya_app_state', JSON.stringify(state));
  }, [state]);

  // Dark Mode
  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.messages, state.isTyping]);

  useEffect(() => {
    if (state.mode === 'guide' && state.messages.length <= 1) {
      handleSendMessage("Hello Zoya! Please explain how I can use you effectively. Show me the different modes and give me some prompt engineering tips.");
    }
  }, [state.mode]);

  const handleAuth = (user: User) => setState(prev => ({ ...prev, user }));
  
  const handleSendMessage = async (customPrompt?: string, fileData?: { data: string, mimeType: string }) => {
    const content = customPrompt || inputMsg;
    if (!content && !fileData && !uploadedImage && !uploadedFile) return;

    const attachmentUrl = fileData?.data || uploadedImage || (uploadedFile?.mimeType.startsWith('image') ? uploadedFile.data : undefined);
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content || (attachmentUrl ? "Analyze this attachment" : ""),
      timestamp: new Date().toISOString(),
      type: uploadedFile?.mimeType === 'application/pdf' ? 'file' : attachmentUrl ? 'image' : 'text',
      fileName: uploadedFile?.name,
      imageUrl: attachmentUrl
    };

    setState(prev => ({ 
      ...prev, 
      messages: [...prev.messages, userMsg],
      isTyping: true 
    }));
    setInputMsg('');
    setUploadedImage(null);
    setUploadedFile(null);
    setShowPaperclip(false);

    try {
      const gemini = new GeminiService(state.apiKey);
      
      let currentFileData: { data: string, mimeType: string } | undefined = fileData;
      if (!currentFileData) {
        if (uploadedImage) currentFileData = { data: uploadedImage, mimeType: 'image/png' };
        else if (uploadedFile) currentFileData = { data: uploadedFile.data, mimeType: uploadedFile.mimeType };
      }

      const aiResponse = await gemini.chat([...state.messages, userMsg], state.mode, currentFileData);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        type: state.mode === 'exam' ? 'quiz' : 'text'
      };

      // Smarter quiz parsing
      if (aiResponse.includes('A)') || aiResponse.includes('A.')) {
        const lines = aiResponse.split('\n');
        const optionsPattern = /^[A-D][).]\s*(.*)/i;
        const options: string[] = [];
        
        lines.forEach(line => {
          const match = line.trim().match(optionsPattern);
          if (match && options.length < 4) {
            options.push(match[1].trim());
          }
        });

        if (options.length >= 2) {
          assistantMsg.type = 'quiz';
          assistantMsg.quizOptions = options;
        }
      }

      setState(prev => ({ 
        ...prev, 
        messages: [...prev.messages, assistantMsg],
        isTyping: false 
      }));

      // Celebrate success in Exam Mode
      if (state.mode === 'exam' && (
        aiResponse.toLowerCase().includes('shandaar') || 
        aiResponse.toLowerCase().includes('correct answer') ||
        aiResponse.toLowerCase().includes('congratulations') ||
        aiResponse.toLowerCase().includes('sahi jawab')
      )) {
        confetti();
      }

      if (state.notificationSound) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.play().catch(() => {});
      }

    } catch (error: any) {
      let friendlyError = error.message || "Something went wrong. Please check your network.";
      const errorStr = JSON.stringify(error).toLowerCase();
      
      if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("exhausted")) {
        friendlyError = "Limit reached! Zoya is taking a short break. Please wait a minute and try again. (Quota Exceeded)";
      } else if (errorStr.includes("api_key") && (errorStr.includes("not found") || errorStr.includes("invalid"))) {
        friendlyError = "API Configuration error. Zoya needs a valid API key to work!";
      }

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Error:** ${friendlyError}`,
        timestamp: new Date().toISOString()
      };
      setState(prev => ({ ...prev, messages: [...prev.messages, errorMsg], isTyping: false }));
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMsg(transcript);
    };
    recognition.start();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'image') {
        setUploadedImage(result);
      } else {
        setUploadedFile({ 
          name: file.name, 
          data: result, 
          mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain')
        });
      }
    };
    reader.readAsDataURL(file); // Always use DataURL for Gemini processing
  };

  const deleteMessage = (id: string) => {
    setState(prev => ({ ...prev, messages: prev.messages.filter(m => m.id !== id) }));
  };

  const exportChat = () => {
    const chatContent = state.messages.map(m => 
      `[${new Date(m.timestamp).toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Zoya_Chat_${state.user?.username}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredMessages = state.messages.filter(m => 
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuizAnswer = async (messageId: string, index: number) => {
    let wasCorrect = false;
    const choiceLabel = String.fromCharCode(65 + index);
    
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => {
        if (m.id === messageId) {
          // Try to find the correct answer in the text (e.g. "Answer: A" or "Correct: B")
          const content = m.content.toUpperCase();
          const answerMatch = content.match(/ANSWER[:\s]*([A-D])/i) || content.match(/CORRECT OPTION[:\s]*([A-D])/i);
          const correctAnswer = answerMatch ? answerMatch[1].toUpperCase() : null;
          
          wasCorrect = correctAnswer === choiceLabel;
          
          // Fallback check if Zoya didn't explicitly state it in text yet
          if (wasCorrect) confetti();
          
          return { ...m, selectedIndex: index };
        }
        return m;
      })
    }));

    // Trigger Zoya to explain the answer
    await handleSendMessage(`I choose ${choiceLabel}. Was I correct? 
    Please congratulate me if I'm right, or tell me the correct answer if I'm wrong. 
    Crucially, provide a detailed 'Logic Breakdown' explaining WHY the correct answer is right and WHY my choice was wrong (if applicable).`);
  };

  const handleGenerateVideo = async () => {
    if (!inputMsg) return;

    // 1. Ensure API Key Selection (as per Veo requirements)
    if (!(await (window as any).aistudio.hasSelectedApiKey())) {
      await (window as any).aistudio.openSelectKey();
    }

    const videoPrompt = inputMsg;
    const msgId = Date.now().toString();
    
    const userMsg: Message = {
      id: msgId,
      role: 'user',
      content: `Generate a video: ${videoPrompt}`,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'I\'m starting to generate your video...',
      timestamp: new Date().toISOString(),
      type: 'video',
      videoProcessing: true
    };

    setState(prev => ({ 
      ...prev, 
      messages: [...prev.messages, userMsg, assistantMsg],
      isTyping: true 
    }));
    setInputMsg('');
    setIsVideoGenerating(true);

    try {
      const gemini = new GeminiService(state.apiKey);
      const videoUrl = await gemini.generateVideo(videoPrompt, (status) => {
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(m => m.id === assistantMsg.id ? { ...m, content: status } : m)
        }));
      });

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === assistantMsg.id ? { 
          ...m, 
          videoUrl, 
          videoProcessing: false,
          content: 'Here is your generated video!' 
        } : m),
        isTyping: false
      }));

      if (state.notificationSound) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.play().catch(() => {});
      }
      confetti();

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === assistantMsg.id ? { 
          ...m, 
          videoProcessing: false,
          type: 'text',
          content: `**Video Generation Error:** ${error.message || "Failed to generate video."}` 
        } : m),
        isTyping: false
      }));
      
      // If error suggests missing key, reset and prompt again (as per skill)
      if (error.message?.includes("not found")) {
        await (window as any).aistudio.openSelectKey();
      }
    } finally {
      setIsVideoGenerating(false);
    }
  };

  if (!state.user?.isLoggedIn) return <Auth onLogin={handleAuth} />;

  return (
    <div className="flex h-screen bg-white dark:bg-whatsapp-dark-bg font-sans selection:bg-whatsapp-green/30">
      
      {/* Sidebar - Quick Access */}
      <div className="hidden md:flex w-[380px] flex-col border-r dark:border-[#222d34] bg-white dark:bg-whatsapp-dark-bg">
        <div className="p-4 bg-gray-50 dark:bg-[#202c33] flex justify-between items-center h-[60px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-whatsapp-teal flex items-center justify-center text-white font-bold ring-2 ring-white/10">
              {state.user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold dark:text-white leading-tight">{state.user.username}</p>
              <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</span>
            </div>
          </div>
          <div className="flex gap-4 text-gray-500 dark:text-[#aebac1]">
            <button onClick={() => setState(prev => ({ ...prev, notificationSound: !prev.notificationSound }))}>
              {state.notificationSound ? <Volume2 size={20}/> : <VolumeX size={20}/>}
            </button>
            <button onClick={() => setShowSettings(true)}><MoreVertical size={20}/></button>
          </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b dark:border-[#222d34]">
          <div className="bg-gray-100 dark:bg-[#202c33] rounded-lg px-3 py-1.5 flex items-center gap-4 focus-within:ring-2 focus-within:ring-whatsapp-green transition-all">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search in chat..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full dark:text-[#d1d7db]" 
            />
          </div>
        </div>

        {/* Mode Quick Switcher */}
        <div className="flex-1 overflow-y-auto whitespace-nowrap">
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-bold text-gray-500 dark:text-[#aebac1] px-2 mb-2 uppercase tracking-wide">AI MODES</h3>
            {['normal', 'study', 'exam', 'pencil', 'guide'].map((m) => (
              <button 
                key={m}
                onClick={() => setState(prev => ({ ...prev, mode: m as ChatMode }))}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${state.mode === m ? 'bg-whatsapp-green/10 dark:bg-[#2a3942]' : 'hover:bg-gray-50 dark:hover:bg-[#202c33]'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${state.mode === m ? 'bg-whatsapp-green text-white shadow-lg' : 'bg-whatsapp-teal text-white'}`}>
                   {m === 'normal' ? <Smile size={24}/> : m === 'study' ? <GraduationCap size={24}/> : m === 'exam' ? <Sparkles size={24}/> : m === 'pencil' ? <PenTool size={24}/> : <HelpCircle size={24}/>}
                </div>
                <div className="text-left flex-1 border-b dark:border-[#222d34] pb-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold dark:text-[#e9edef] capitalize">{m} Mode</p>
                    <span className="text-[10px] text-gray-400">Active</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate w-48">Talk to Zoya in {m} mode...</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Chat Header */}
        <div className="h-[60px] bg-gray-50 dark:bg-[#202c33] border-b dark:border-none p-3 flex justify-between items-center px-4 z-20">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-whatsapp-teal" onClick={() => setShowSettings(true)}><ChevronLeft/></button>
            <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden relative border border-white/20">
               <img src={state.zoyaAvatar} alt="Zoya" className="w-full h-full object-cover" />
               <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#202c33] rounded-full"></div>
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-[#e9edef] leading-tight">Zoya AI</p>
              <p className="text-[11px] text-whatsapp-green font-bold">Online</p>
            </div>
          </div>
          <div className="flex gap-5 text-gray-500 dark:text-[#aebac1]">
            <button 
              className="hover:text-blue-500 transition-colors active:scale-95"
              onClick={() => {
                setState(prev => ({ ...prev, mode: 'guide' }));
                handleSendMessage("Hello Zoya! I need help understanding how to use you effectively.");
              }}
              title="Help & Guide"
            >
              <HelpCircle size={20}/>
            </button>
            <button 
              className="hover:text-whatsapp-teal transition-colors active:scale-95"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Zoya AI',
                    text: 'Check out Zoya AI - My personal learning companion!',
                    url: window.location.href,
                  });
                } else {
                  alert("Sharing not supported on this browser. Copy the URL to share!");
                }
              }}
              title="Share App"
            >
              <Share2 size={20}/>
            </button>
            <button 
              className="hover:text-whatsapp-teal transition-colors active:scale-95"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Zoya AI',
                    text: 'Check out Zoya AI - My personal learning companion!',
                    url: window.location.href,
                  }).catch(console.error);
                } else {
                  prompt("Copy this link to share with friends:", window.location.href);
                }
              }}
              title="Share App"
            >
              <Share2 size={20}/>
            </button>
            <button 
              className="hover:text-whatsapp-teal transition-colors active:scale-95"
              onClick={() => setActiveCall('video')}
            >
              <Video size={20}/>
            </button>
            <button 
              className="hover:text-whatsapp-teal transition-colors active:scale-95"
              onClick={() => setActiveCall('audio')}
            >
              <Phone size={20}/>
            </button>
            <button className="hover:text-whatsapp-teal" onClick={() => setShowSettings(!showSettings)}><MoreVertical size={20}/></button>
          </div>
        </div>

        {/* Quick Mode Switcher (Visible on all devices) */}
        <div className="bg-white dark:bg-[#111b21] border-b dark:border-[#222d34] p-2 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth z-20 shadow-sm">
          {[
            { id: 'normal', label: 'Chat', icon: <Smile size={14}/> },
            { id: 'study', label: 'Study Mode', icon: <GraduationCap size={14}/> },
            { id: 'exam', label: 'Exam Mode', icon: <Sparkles size={14}/> },
            { id: 'pencil', label: 'Pencil AI', icon: <PenTool size={14}/> },
            { id: 'guide', label: 'Guide', icon: <HelpCircle size={14}/> }
          ].map((m) => (
            <button 
              key={m.id}
              onClick={() => setState(prev => ({ ...prev, mode: m.id as ChatMode }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                state.mode === m.id 
                ? 'bg-whatsapp-green text-white shadow-md' 
                : 'bg-gray-100 dark:bg-[#202c33] text-gray-600 dark:text-[#aebac1] hover:bg-gray-200 dark:hover:bg-[#2a3942]'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
          
          {state.mode === 'guide' && (
            <button 
              onClick={() => handleSendMessage("Tell me about prompt engineering tips!")}
              className="ml-auto bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md animate-bounce"
            >
              Get Tips
            </button>
          )}

          {state.mode === 'exam' && (
            <button 
              onClick={() => handleSendMessage("Start a new Computer Science quiz for me!")}
              className="ml-auto bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md animate-pulse"
            >
              Start New Quiz
            </button>
          )}
        </div>

        {/* Messages Body */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:px-12 whatsapp-bg relative z-10"
        >
          {state.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
              <div className="w-24 h-24 bg-whatsapp-teal text-white rounded-[40px] flex items-center justify-center rotate-6 shadow-xl relative overflow-hidden group">
                <Smile size={48} />
                <motion.div 
                  animate={{ x: ['-100%', '200%'] }} 
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute inset-0 bg-white/20 -skew-x-12" 
                />
              </div>
              <h2 className="text-2xl font-bold dark:text-white">Say Hello to Zoya!</h2>
              <p className="max-w-xs text-sm dark:text-gray-400">Your personal AI assistant ready to help with study, exams, or just regular chat.</p>
              <button 
                onClick={() => setInputMsg("Hey Zoya! Introduce yourself as my teacher.")}
                className="mt-4 px-6 py-2 bg-whatsapp-green text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
              >
                Get Started
              </button>
            </div>
          )}

          {(searchQuery ? filteredMessages : state.messages).map((m) => (
            <ChatBubble 
              key={m.id} 
              message={m} 
              onDelete={deleteMessage}
              onQuizAnswer={handleQuizAnswer} 
              zoyaAvatar={state.zoyaAvatar}
              userAvatar={state.user?.avatar || `https://ui-avatars.com/api/?name=${state.user?.username || 'User'}&background=128C7E&color=fff`}
            />
          ))}
          {state.isTyping && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, x: -10 }} 
              animate={{ opacity: 1, scale: 1, x: 0 }} 
              className="flex justify-start mb-4 gap-2 items-end"
            >
              <div className="relative group">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.4, 1], 
                    opacity: [0.1, 0.4, 0.1],
                    boxShadow: [
                      "0 0 0px rgba(37, 211, 102, 0)",
                      "0 0 20px rgba(37, 211, 102, 0.4)",
                      "0 0 0px rgba(37, 211, 102, 0)"
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="absolute inset-0 bg-whatsapp-green rounded-full blur-xl" 
                />
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 relative border border-white/20 z-10 shadow-lg ring-2 ring-whatsapp-green/20">
                  <img src={state.zoyaAvatar} alt="Zoya" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#202c33] rounded-full z-20 animate-pulse shadow-sm" />
              </div>
              <div className="chat-bubble-left overflow-hidden relative min-w-[70px] flex flex-col items-center justify-center p-3">
                {/* Enhanced Shimmer Effect Overlay */}
                <motion.div 
                  className="absolute inset-0 bg-linear-to-r from-transparent via-whatsapp-green/10 dark:via-white/5 to-transparent z-0"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
                <div className="flex gap-2 relative z-10">
                  {[0, 1, 2].map((i) => (
                    <motion.div 
                      key={i}
                      animate={{ 
                        y: [0, -8, 0],
                        scale: [1, 1.3, 1],
                        backgroundColor: i === 1 ? ["#128c7e", "#25d366", "#128c7e"] : ["#128c7e", "#25d366", "#128c7e"]
                      }} 
                      transition={{ 
                        repeat: Infinity, 
                        duration: 0.8, 
                        delay: i * 0.15,
                        ease: "anticipate"
                      }} 
                      className="w-2.5 h-2.5 bg-whatsapp-teal dark:bg-whatsapp-green rounded-full shadow-[0_2px_10px_rgba(37,211,102,0.3)]" 
                    />
                  ))}
                </div>
              </div>
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex flex-col gap-0.5 ml-1 mb-1 hidden sm:flex"
              >
                <span className="text-[10px] font-black text-whatsapp-teal dark:text-whatsapp-green uppercase tracking-[0.2em] leading-none">
                  Zoya is
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] leading-none">
                  Thinking...
                </span>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Input Bar Section */}
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-3 flex flex-col gap-2 relative z-20">
          
          {/* Study Mode Topic Explorer */}
          {state.mode === 'study' && state.messages.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
            >
              {[
                { label: 'Math: Calculus', prompt: 'Explain Calculus with real-world examples and a case study.' },
                { label: 'DBMS: SQL', prompt: 'Explain SQL Joins with a real-world case study like Amazon or Netflix.' },
                { label: 'C++: OOPS', prompt: 'Explain OOPS concepts with a practical case study.' },
                { label: 'Data Structures', prompt: 'Explain Stack and Queue with real-world examples.' },
                { label: 'Networking', prompt: 'Explain OSI Model with a case study of how internet works.' },
              ].map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => handleSendMessage(topic.prompt)}
                  className="whitespace-nowrap px-3 py-1.5 bg-whatsapp-teal/10 dark:bg-whatsapp-green/10 text-whatsapp-teal dark:text-whatsapp-green text-[11px] font-bold rounded-full border border-whatsapp-teal/20 dark:border-whatsapp-green/20 hover:bg-whatsapp-teal dark:hover:bg-whatsapp-green hover:text-white transition-all flex items-center gap-1.5"
                >
                  <GraduationCap size={14} /> {topic.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Upload Previews */}
          <AnimatePresence>
            {(uploadedImage || uploadedFile) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 w-full p-4 bg-white dark:bg-[#202c33] border-t dark:border-[#222d34] shadow-xl flex items-center gap-4"
              >
                {uploadedImage && <img src={uploadedImage} className="w-16 h-16 object-cover rounded shadow-md border-2 border-whatsapp-green" />}
                {uploadedFile && (
                  <div className={`p-3 rounded font-bold flex items-center gap-2 ${uploadedFile.mimeType === 'application/pdf' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                    <File size={20}/> {uploadedFile.name}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-bold dark:text-white">{uploadedImage ? "Image Ready" : "File Attached"}</p>
                  <p className="text-xs text-gray-500">Zoya will analyze this in the next message.</p>
                </div>
                <button onClick={() => { setUploadedImage(null); setUploadedFile(null); }} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X size={16}/></button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 text-gray-500 dark:text-[#8696a0]">
              <button 
                onClick={() => setShowEmoji(!showEmoji)}
                className={`hover:text-whatsapp-teal transition-colors ${showEmoji ? 'text-whatsapp-green' : ''}`}
              ><Smile size={26}/></button>
              <div className="relative">
                <button 
                  onClick={() => setShowPaperclip(!showPaperclip)}
                  className={`hover:text-whatsapp-teal transition-colors ${showPaperclip ? 'text-whatsapp-green' : ''}`}
                ><Paperclip size={24}/></button>
                <AnimatePresence>
                  {showPaperclip && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: -10 }} exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      className="absolute bottom-12 left-0 bg-white dark:bg-[#233138] rounded-xl shadow-2xl p-2 flex flex-col gap-1 w-40 z-50 overflow-hidden"
                    >
                      <button onClick={() => imageInputRef.current?.click()} className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-bg transition-colors rounded-lg text-sm text-gray-700 dark:text-gray-300">
                        <div className="bg-purple-500 text-white p-2 rounded-full"><ImageIcon size={16}/></div> Photos
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-bg transition-colors rounded-lg text-sm text-gray-700 dark:text-gray-300">
                        <div className="bg-indigo-500 text-white p-2 rounded-full"><File size={16}/></div> Documents
                      </button>
                      <button 
                        onClick={() => { handleGenerateVideo(); setShowPaperclip(false); }} 
                        className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-bg transition-colors rounded-lg text-sm text-gray-700 dark:text-gray-300"
                        disabled={!inputMsg || isVideoGenerating}
                      >
                        <div className="bg-orange-500 text-white p-2 rounded-full"><Video size={16}/></div> Generate Video
                      </button>
                      {state.mode === 'pencil' && (
                        <button onClick={() => setState(prev => ({ ...prev, mode: 'pencil' }))} className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-bg transition-colors rounded-lg text-sm text-gray-700 dark:text-gray-300">
                          <div className="bg-orange-500 text-white p-2 rounded-full"><PenTool size={16}/></div> Canvas
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex-1 flex gap-2 items-center bg-white dark:bg-[#2a3942] rounded-xl p-2 shadow-sm border border-transparent focus-within:border-whatsapp-green transition-all">
              <input 
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none outline-none py-1 px-2 text-gray-700 dark:text-[#d1d7db]"
              />
            </div>

            <button 
              onClick={inputMsg ? () => handleSendMessage() : handleVoiceInput}
              className={`w-12 h-12 flex items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-90 ${inputMsg ? 'bg-whatsapp-green hover:bg-whatsapp-green/90 rotate-45' : isListening ? 'bg-red-500 animate-pulse' : 'bg-whatsapp-green'}`}
            >
              {inputMsg ? <Send size={22}/> : <Mic size={22}/>}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {state.mode === 'pencil' && (
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="absolute inset-0 z-[60]"
            >
              <DrawingCanvas 
                onSend={(img, caption) => { 
                  handleSendMessage(caption || "Analyze this drawing and solve it step-by-step.", { data: img, mimeType: 'image/png' }); 
                  setState(prev => ({ ...prev, mode: 'normal' })); 
                }} 
                onClose={() => setState(prev => ({ ...prev, mode: 'normal' }))} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emoji Picker Popover */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-4 bg-white dark:bg-whatsapp-dark-bubble rounded-2xl shadow-2xl p-4 grid grid-cols-6 gap-2 border dark:border-gray-800 z-[100]"
            >
              {['😀','😂','🥰','😎','🤔','😴','🔥','💯','🙌','📚','💻','✍️'].map(e => (
                <button key={e} onClick={() => { setInputMsg(prev => prev + e); setShowEmoji(false); }} className="text-2xl hover:scale-125 transition-transform p-1">{e}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden Inputs */}
      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt" onChange={(e) => handleFileUpload(e, 'file')} />

      {/* Settings Panel Overlay */}
      <AnimatePresence>
        {activeCall && (
          <CallOverlay 
            type={activeCall} 
            onClose={() => setActiveCall(null)} 
            zoyaAvatar={state.zoyaAvatar}
            onUserSpeak={async (text) => {
              // Simulating Zoya hearing and responding
              await handleSendMessage(`[Voice Call Input]: ${text}`);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="absolute inset-y-0 right-0 w-full md:w-[400px] z-[100]"
          >
            <Settings 
              apiKey={state.apiKey}
              setApiKey={(apiKey) => setState(prev => ({ ...prev, apiKey }))}
              isDarkMode={state.isDarkMode}
              setIsDarkMode={(isDarkMode) => setState(prev => ({ ...prev, isDarkMode }))}
              mode={state.mode}
              setMode={(mode) => setState(prev => ({ ...prev, mode }))}
              onClearChat={() => setState(prev => ({ ...prev, messages: [] }))}
              onLogout={() => setState(prev => ({ ...prev, user: null }))}
              onExport={exportChat}
              notificationSound={state.notificationSound}
              setNotificationSound={(notificationSound) => setState(prev => ({ ...prev, notificationSound }))}
              zoyaAvatar={state.zoyaAvatar}
              setZoyaAvatar={(avatar) => setState(prev => ({ ...prev, zoyaAvatar: avatar }))}
              user={state.user}
              setUserAvatar={(avatar) => setState(prev => ({ 
                ...prev, 
                user: prev.user ? { ...prev.user, avatar } : null 
              }))}
              onClose={() => setShowSettings(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 font-medium opacity-50 pointer-events-none uppercase tracking-widest whitespace-nowrap z-50">
        Owner: Shalu Yadav • Zoya AI Powered
      </div>
    </div>
  );
}

// No redundant imports needed here
