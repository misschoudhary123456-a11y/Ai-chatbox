import { motion, AnimatePresence } from 'motion/react';
import { Phone, Video, X, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, UserCircle, Camera } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface CallOverlayProps {
  type: 'audio' | 'video';
  onClose: () => void;
  zoyaAvatar: string;
}

export default function CallOverlay({ type, onClose, zoyaAvatar }: CallOverlayProps) {
  const [status, setStatus] = useState('Calling...');
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setStatus('Connected'), 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (status === 'Connected') {
      const interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'Connected' && streamRef.current && localVideoRef.current && !localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject = streamRef.current;
    }
  }, [status]);

  useEffect(() => {
    async function setupMedia() {
      try {
        // Stop current tracks if they exist before switching
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video' ? { facingMode: facingMode } : false,
          audio: true
        });
        streamRef.current = stream;
        // Try to set it immediately if already available
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    }

    setupMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [type, facingMode]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 z-[200] bg-whatsapp-dark-bg flex flex-col items-center justify-between text-white overflow-hidden"
    >
      {/* Background for Video */}
      {type === 'video' && status === 'Connected' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-0"
        >
          <img src={zoyaAvatar} alt="Zoya Video" className="w-full h-full object-cover blur-[1px]" />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      )}

      {/* Header Overlay */}
      <div className="relative z-10 w-full p-8 text-center bg-gradient-to-b from-black/60 to-transparent">
        {type === 'audio' || status === 'Calling...' ? (
          <motion.div 
            animate={status === 'Calling...' ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 border-4 border-whatsapp-green/30 shadow-2xl relative"
          >
            <img src={zoyaAvatar} alt="Zoya" className="w-full h-full object-cover" />
            {status === 'Calling...' && (
              <div className="absolute inset-0 bg-whatsapp-green/20 animate-pulse" />
            )}
          </motion.div>
        ) : null}
        <h2 className="text-3xl font-bold mb-2 drop-shadow-md">Zoya AI</h2>
        <p className="text-whatsapp-green font-medium tracking-widest uppercase text-sm drop-shadow-sm">
          {status === 'Connected' ? formatTime(timer) : status}
        </p>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 w-full flex items-center justify-center p-4">
        {type === 'video' && status === 'Connected' && (
          <div className="relative w-full h-full max-w-4xl flex items-center justify-center">
            {/* Zoya's Focused "Live" Feed */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-64 h-64 md:w-80 md:h-80 rounded-full border-8 border-white/10 overflow-hidden shadow-2xl ring-1 ring-whatsapp-green/30 relative"
            >
              <img src={zoyaAvatar} alt="Zoya Main" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-whatsapp-green/5 animate-pulse pointer-events-none" />
              
              {/* Floating Live Indicator */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-red-600/80 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg pointer-events-none">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            </motion.div>

            {/* Local Video Stream (User) */}
            <div className="absolute bottom-4 right-4 w-32 h-44 md:w-48 md:h-64 bg-gray-900 rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden group cursor-move">
              <video 
                ref={localVideoRef}
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${isVideoOff ? 'hidden' : ''}`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <UserCircle size={48} className="text-gray-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">You</span>
              </div>
            </div>
          </div>
        )}

        {type === 'audio' && status === 'Connected' && (
          <div className="flex gap-3 items-end h-32">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [30, Math.random() * 100 + 30, 30] }}
                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.04 }}
                className="w-2.5 bg-whatsapp-green rounded-full shadow-[0_0_10px_rgba(37,211,102,0.5)]"
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className="relative z-10 w-full p-12 flex justify-center gap-8 bg-gradient-to-t from-black/60 to-transparent">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-6 rounded-full transition-all transform hover:scale-110 active:scale-95 shadow-xl ${isMuted ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}
        >
          {isMuted ? <MicOff size={32}/> : <Mic size={32}/>}
        </button>
        
        {type === 'video' && (
          <>
            <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-6 rounded-full transition-all transform hover:scale-110 active:scale-95 shadow-xl ${isVideoOff ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}
            >
              {isVideoOff ? <VideoOff size={32}/> : <VideoIcon size={32}/>}
            </button>
            <button 
              onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
              className="p-6 rounded-full bg-white/10 hover:bg-white/20 transition-all transform hover:scale-110 active:scale-95 shadow-xl"
            >
              <Camera size={32}/>
            </button>
          </>
        )}

        <button 
          onClick={onClose}
          className="p-7 bg-red-500 hover:bg-red-600 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-90"
        >
          <PhoneOff size={36} className="rotate-[135deg]" />
        </button>
      </div>
    </motion.div>
  );
}
