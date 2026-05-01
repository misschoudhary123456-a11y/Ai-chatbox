import { useState } from 'react';
import { User } from '../types';
import { LogIn, UserPlus, Shield } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('Please fill in all fields');
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem('zoya_users') || '{}');

    if (isLogin) {
      if (!storedUsers[cleanUsername]) {
        // Auto-register if user not found to make it easier
        storedUsers[cleanUsername] = cleanPassword;
        localStorage.setItem('zoya_users', JSON.stringify(storedUsers));
        onLogin({ username: cleanUsername, isLoggedIn: true });
      } else if (storedUsers[cleanUsername] === cleanPassword) {
        onLogin({ username: cleanUsername, isLoggedIn: true });
      } else {
        setError('Incorrect password. Please try again.');
      }
    } else {
      if (storedUsers[cleanUsername]) {
        setError('Username already exists. Try logging in!');
      } else {
        storedUsers[cleanUsername] = cleanPassword;
        localStorage.setItem('zoya_users', JSON.stringify(storedUsers));
        onLogin({ username: cleanUsername, isLoggedIn: true });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-whatsapp-bg dark:bg-whatsapp-dark-bg p-6 whatsapp-bg">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-whatsapp-dark-bubble p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800"
      >
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-20 h-20 bg-whatsapp-teal rounded-3xl flex items-center justify-center text-white shadow-lg">
            <Shield size={40} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Zoya AI</h1>
            <p className="text-gray-500 dark:text-gray-400">Your AI Study Buddy</p>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-whatsapp-green transition-all dark:text-white"
              placeholder="Enter username"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-whatsapp-green transition-all dark:text-white"
              placeholder="Enter password"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button 
            type="submit"
            className="w-full py-4 bg-whatsapp-green hover:bg-whatsapp-green/90 text-white rounded-xl font-bold text-lg shadow-lg shadow-whatsapp-green/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isLogin ? <LogIn size={20}/> : <UserPlus size={20}/>}
            {isLogin ? 'Login to Zoya' : 'Sign Up to Zoya'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-whatsapp-teal dark:text-whatsapp-green font-semibold hover:underline"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
