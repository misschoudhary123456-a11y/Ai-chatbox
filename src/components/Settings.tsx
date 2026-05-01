import { ChatMode, User } from "../types";
import { Settings as SettingsIcon, Key, Moon, Sun, Trash2, BookOpen, GraduationCap, PenTool, MessageSquare, LogOut, Download, Bell, BellOff, Camera, UserCircle, RotateCcw, HelpCircle, Code, Lightbulb, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingsProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
  onClearChat: () => void;
  onLogout: () => void;
  onExport: () => void;
  notificationSound: boolean;
  setNotificationSound: (val: boolean) => void;
  zoyaAvatar: string;
  setZoyaAvatar: (avatar: string) => void;
  user: User | null;
  setUserAvatar: (avatar: string) => void;
  onClose: () => void;
}

export default function Settings({ 
  apiKey, setApiKey, isDarkMode, setIsDarkMode, mode, setMode, onClearChat, onLogout, onExport, notificationSound, setNotificationSound, zoyaAvatar, setZoyaAvatar, user, setUserAvatar, onClose 
}: SettingsProps) {
  
  const modes: { id: ChatMode; icon: any; label: string; desc: string }[] = [
    { id: 'normal', icon: MessageSquare, label: 'Normal Mode', desc: 'Friendly chat with Zoya' },
    { id: 'study', icon: GraduationCap, label: 'Study Mode', desc: 'Step-by-step BCA teacher' },
    { id: 'exam', icon: BookOpen, label: 'Exam Mode', desc: 'AI-generated MCQ quizzes' },
    { id: 'pencil', icon: PenTool, label: 'Pencil AI', desc: 'Solve questions by drawing' },
    { id: 'guide', icon: HelpCircle, label: 'Guide Mode', desc: 'Learn how to use Zoya AI' },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-whatsapp-dark-bubble border-l dark:border-gray-800 shadow-2xl">
      <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2 font-bold text-lg text-gray-700 dark:text-gray-200">
          <SettingsIcon size={20} />
          Settings
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* USER PROFILE SECTION */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
            <UserCircle size={16} /> Your Profile
          </label>
          <div className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-whatsapp-teal overflow-hidden bg-white shadow-sm">
                  <img 
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=128C7E&color=fff`} 
                    alt="User" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 flex gap-1">
                  <button 
                    onClick={() => document.getElementById('user-avatar-upload')?.click()}
                    className="p-1.5 bg-whatsapp-teal text-white rounded-full shadow-md hover:scale-110 transition-transform"
                    title="Upload Avatar"
                  >
                    <Camera size={12} />
                  </button>
                  {user?.avatar && (
                    <button 
                      onClick={() => setUserAvatar('')}
                      className="p-1.5 bg-gray-500 text-white rounded-full shadow-md hover:scale-110 transition-transform"
                      title="Reset to Default"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
                <input 
                  id="user-avatar-upload"
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setUserAvatar(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 dark:text-white">{user?.username}</h3>
                <p className="text-[10px] text-gray-500 uppercase font-black">Student Account</p>
              </div>
            </div>
          </div>
        </div>

        {/* API KEY SECTION */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
            <Key size={16} /> Gemini API Key
          </label>
          <div className="relative">
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here..."
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-whatsapp-green outline-none transition-all dark:text-white"
            />
          </div>
          <p className="text-[10px] text-gray-400">Settings are saved locally on this device.</p>
        </div>

        {/* MODES SECTION */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
            <GraduationCap size={16} /> AI Chat Modes
          </label>
          <div className="grid gap-3">
            {modes.map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                    isActive 
                      ? "bg-whatsapp-green/10 border-whatsapp-green shadow-sm"
                      : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    isActive ? "bg-whatsapp-green text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  )}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className={cn("font-bold", isActive ? "text-whatsapp-green" : "text-gray-700 dark:text-gray-200")}>{m.label}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* AVATAR SECTION */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
            <UserCircle size={16} /> Zoya's Avatar
          </label>
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-4 border-whatsapp-green overflow-hidden bg-gray-100 shadow-lg">
                  <img src={zoyaAvatar} alt="Zoya" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 flex gap-2">
                  <button 
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    className="p-2 bg-whatsapp-green text-white rounded-full shadow-md hover:scale-110 transition-transform"
                    title="Upload Avatar"
                  >
                    <Camera size={16} />
                  </button>
                  <button 
                    onClick={() => setZoyaAvatar('https://ui-avatars.com/api/?name=Zoya&background=075E54&color=fff')}
                    className="p-2 bg-gray-500 text-white rounded-full shadow-md hover:scale-110 transition-transform"
                    title="Reset to Default"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
                <input 
                  id="avatar-upload"
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setZoyaAvatar(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { name: 'Teacher', url: 'https://ui-avatars.com/api/?name=Teacher&background=075E54&color=fff' },
                { name: 'Zoya', url: 'https://ui-avatars.com/api/?name=Zoya&background=075E54&color=fff' },
                { name: 'Robot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Zoya' },
                { name: 'Friendly', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoya' },
              ].map((av) => (
                <button 
                  key={av.url}
                  onClick={() => setZoyaAvatar(av.url)}
                  className={cn(
                    "w-12 h-12 rounded-full border-2 overflow-hidden transition-all",
                    zoyaAvatar === av.url ? "border-whatsapp-green scale-110 shadow-md" : "border-transparent hover:border-gray-300"
                  )}
                >
                  <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* APPEARANCE SECTION */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
            <Moon size={16} /> Appearance
          </label>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800"
          >
            <span className="font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
            {isDarkMode ? <Sun className="text-yellow-500" /> : <Moon className="text-whatsapp-teal" />}
          </button>
        </div>

        {/* NOTIFICATIONS SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#202c33] rounded-xl">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", notificationSound ? "bg-whatsapp-green/10 text-whatsapp-green" : "bg-gray-200 text-gray-500")}>
                {notificationSound ? <Bell size={20} /> : <BellOff size={20} />}
              </div>
              <div>
                <p className="font-bold text-sm dark:text-white">Message Sounds</p>
                <p className="text-[10px] text-gray-400">Play sound on Zoya's reply</p>
              </div>
            </div>
            <button 
              onClick={() => setNotificationSound(!notificationSound)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                notificationSound ? "bg-whatsapp-green" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                notificationSound ? "right-1" : "left-1"
              )} />
            </button>
          </div>
        </div>

        {/* HELP & TIPS SECTION */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
            <Lightbulb size={16} /> Help & Tips
          </label>
          <div className="space-y-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex gap-3">
              <Code size={18} className="text-blue-500 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-blue-800 dark:text-blue-300">Prompt Engineering</p>
                <p className="text-blue-600/80 dark:text-blue-400/80">Be specific! Example: "Explain OOPS using a Cricket Match analogy".</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Zap size={18} className="text-orange-500 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-orange-800 dark:text-orange-300">Mode Switching</p>
                <p className="text-orange-600/80 dark:text-orange-400/80">Use Study Mode for depth and Exam Mode to test your speed.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setMode('guide');
                onClose();
              }}
              className="w-full mt-2 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-600 transition-colors"
            >
              Open Interactive Guide
            </button>
          </div>
        </div>

        {/* ACTIONS SECTION */}
        <div className="space-y-4 pt-4">
          <button 
            onClick={onExport}
            className="w-full p-4 flex items-center gap-3 text-whatsapp-teal hover:bg-whatsapp-teal/10 rounded-xl transition-colors font-semibold"
          >
            <Download size={20} />
            Export Chat History (Text)
          </button>

          <button 
            onClick={onClearChat}
            className="w-full p-4 flex items-center gap-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-semibold"
          >
            <Trash2 size={20} />
            Clear Chat History
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full p-4 flex items-center gap-3 text-gray-500 hover:bg-gray-500/10 rounded-xl transition-colors font-semibold"
          >
            <LogOut size={20} />
            Logout Account
          </button>
        </div>
      </div>
    </div>
  );
}
