/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  PlusCircle, 
  History, 
  Flame, 
  TrendingUp, 
  Target, 
  ChevronRight, 
  LogOut,
  Zap,
  Star,
  Shield,
  Gem,
  LayoutDashboard,
  Settings,
  BrainCircuit,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Check,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---

interface User {
  name: string;
  careerGoal: string;
  startDate: string; // ISO string
  lastResetSeason?: string; // e.g. "2026-S1"
  carryOverXP?: number;
}

interface Connection {
  id: string;
  date: string;
  description: string;
  points: number;
  quality: 'Low' | 'Medium' | 'High' | 'Setback';
  isRelevant: boolean;
  feedback: string;
}

interface FriendEvent {
  id: string;
  description: string;
  date: string;
  points: number;
}

interface Friend {
  id: string;
  name: string;
  score: number;
  monthlyScore: number;
  yearlyScore: number;
  rank: string;
  avatar: string;
  streak: number;
  recentEvents: FriendEvent[];
}

// --- Constants & Config ---

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || '' });

const RANKS = [
  { name: 'Wood', color: 'text-[#d97706]', bg: 'bg-[#d97706]/10', icon: Shield, border: 'border-[#d97706]/30', hex: '#d97706', glow: 'rgba(217, 119, 6, 0.3)' },
  { name: 'Copper', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Shield, border: 'border-orange-500/30', hex: '#f97316', glow: 'rgba(249, 115, 22, 0.3)' },
  { name: 'Silver', color: 'text-slate-100', bg: 'bg-slate-100/10', icon: Shield, border: 'border-slate-100/30', hex: '#f1f5f9', glow: 'rgba(241, 245, 249, 0.3)' },
  { name: 'Gold', color: 'text-yellow-300', bg: 'bg-yellow-300/10', icon: Zap, border: 'border-yellow-300/30', hex: '#fde047', glow: 'rgba(253, 224, 71, 0.3)' },
  { name: 'Emerald', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: Star, border: 'border-emerald-400/30', hex: '#34d399', glow: 'rgba(52, 211, 153, 0.3)' },
  { name: 'Ruby', color: 'text-[#ff4b6b]', bg: 'bg-[#ff4b6b]/10', icon: Star, border: 'border-[#ff4b6b]/30', hex: '#ff4b6b', glow: 'rgba(255, 75, 107, 0.3)' },
  { name: 'Sapphire', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Gem, border: 'border-blue-400/30', hex: '#60a5fa', glow: 'rgba(96, 165, 250, 0.3)' },
  { name: 'Diamond', color: 'text-[#00d2ff]', bg: 'bg-[#00d2ff]/10', icon: Gem, border: 'border-[#00d2ff]/30', hex: '#00d2ff', glow: 'rgba(0, 210, 255, 0.3)' },
  { name: 'Obsidian', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Target, border: 'border-purple-500/30', hex: '#a855f7', glow: 'rgba(168, 85, 247, 0.3)' },
  { name: 'Platinum', color: 'text-white', bg: 'bg-white/10', icon: Shield, border: 'border-white/30', hex: '#ffffff', glow: 'rgba(255, 255, 255, 0.3)' },
];

const MOCK_FRIENDS: Friend[] = [
  { 
    id: '1', 
    name: 'Alex Rivera', 
    score: 480, 
    monthlyScore: 120,
    yearlyScore: 350,
    rank: 'Ruby', 
    avatar: 'https://picsum.photos/seed/alex/100',
    streak: 12,
    recentEvents: [
      { id: 'e1', description: 'Met with Lead Designer at Meta', date: '2024-04-15', points: 85 },
      { id: 'e2', description: 'Quick coffee chat with SWE intern', date: '2024-04-14', points: 30 },
      { id: 'e3', description: 'Attended UX Design Workshop', date: '2024-04-12', points: 50 },
    ]
  },
  { 
    id: '2', 
    name: 'Jordan Lee', 
    score: 620, 
    monthlyScore: 210,
    yearlyScore: 580,
    rank: 'Diamond', 
    avatar: 'https://picsum.photos/seed/jordan/100',
    streak: 24,
    recentEvents: [
      { id: 'e4', description: 'Referral call with Google Recruiter', date: '2024-04-16', points: 95 },
      { id: 'e5', description: 'Mock interview session', date: '2024-04-15', points: 60 },
    ]
  },
  { 
    id: '3', 
    name: 'Sarah Chen', 
    score: 310, 
    monthlyScore: 85,
    yearlyScore: 280,
    rank: 'Gold', 
    avatar: 'https://picsum.photos/seed/sarah/100',
    streak: 5,
    recentEvents: [
      { id: 'e6', description: 'LinkedIn reachout to alumni', date: '2024-04-14', points: 15 },
    ]
  },
  { 
    id: '4', 
    name: 'Marcus Brown', 
    score: 150, 
    monthlyScore: 40,
    yearlyScore: 140,
    rank: 'Copper', 
    avatar: 'https://picsum.photos/seed/marcus/100',
    streak: 2,
    recentEvents: [
      { id: 'e7', description: 'Career fair networking', date: '2024-04-10', points: 40 },
    ]
  },
  { 
    id: '5', 
    name: 'Elena Vance', 
    score: 90, 
    monthlyScore: 25,
    yearlyScore: 90,
    rank: 'Wood', 
    avatar: 'https://picsum.photos/seed/elena/100',
    streak: 1,
    recentEvents: [
      { id: 'e8', description: 'Set up networking spreadsheet', date: '2024-04-17', points: 10 },
    ]
  },
];

// --- AI Service ---

const analyzeNetworking = async (description: string, careerGoal: string) => {
  if (!GEMINI_API_KEY) {
    // Fallback if no API key for evaluation
    return {
      points: Math.floor(Math.random() * 80) + 10,
      quality: 'Medium',
      isRelevant: description.toLowerCase().includes(careerGoal.toLowerCase().split(' ')[0]),
      feedback: "Great hustle! Keep connecting with like-minded professionals."
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User Career Goal: ${careerGoal}\nNetworking Event Description: ${description}`,
      config: {
        systemInstruction: `You are an expert networking coach. Analyze the user's event description relative to their career goal. 
        Return JSON with 'points' (INTEGER, can be negative for failures or setbacks like getting fired), 
        'quality' ('Low'|'Medium'|'High'|'Setback'), 'isRelevant' (boolean), and 'feedback' (string). 
        Negative points should be given for events that significantly hinder professional progress.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            points: { type: Type.INTEGER },
            quality: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Setback'] },
            isRelevant: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING }
          },
          required: ['points', 'quality', 'isRelevant', 'feedback']
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw {
      error: "Analysis failure",
      message: error instanceof Error ? error.message : "Unknown AI error"
    };
  }
};

// --- Main Application ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'friends' | 'connections'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [showPromo, setShowPromo] = useState<{from: string, to: string} | null>(null);
  const [promoQueue, setPromoQueue] = useState<{from: string, to: string}[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendScoreView, setFriendScoreView] = useState<'monthly' | 'yearly' | 'lifetime'>('lifetime');

  // Persistence
  useEffect(() => {
    const savedUser = localStorage.getItem('networth_user');
    const savedConnections = localStorage.getItem('networth_connections');
    
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedConnections) setConnections(JSON.parse(savedConnections));
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('networth_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('networth_connections', JSON.stringify(connections));
  }, [connections]);

  // Derived Stats
  const stats = useMemo(() => {
    if (!user) return { score: 0, rank: RANKS[0], lifetimePoints: 0, monthlyScore: 0, yearlyScore: 0, streak: 0, progress: 0, season: '', nextReset: '' };
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentSeasonIdx = Math.floor(currentMonth / 4) + 1;
    const currentSeasonId = `${currentYear}-S${currentSeasonIdx}`;
    const seasonNames = ['Spring', 'Summer', 'Fall'];
    const seasonName = `${seasonNames[currentSeasonIdx - 1]} ${currentYear}`;

    // Reset Tracking
    let semesterConnections = connections.filter(c => {
      const d = new Date(c.date);
      const m = d.getMonth();
      const y = d.getFullYear();
      const s = Math.floor(m / 4) + 1;
      return `${y}-S${s}` === currentSeasonId;
    });

    const lifetimePoints = connections.reduce((sum, c) => sum + (c.isRelevant ? c.points * 1.5 : c.points), 0);
    const yearlyScore = connections.filter(c => new Date(c.date).getFullYear() === currentYear)
                                   .reduce((sum, c) => sum + (c.isRelevant ? c.points * 1.5 : c.points), 0);
    const monthlyScore = connections.filter(c => new Date(c.date).getMonth() === currentMonth && new Date(c.date).getFullYear() === currentYear)
                                    .reduce((sum, c) => sum + (c.isRelevant ? c.points * 1.5 : c.points), 0);
    
    // Semester XP includes carryOver from reset
    const semesterXP = semesterConnections.reduce((sum, c) => sum + (c.isRelevant ? c.points * 1.5 : c.points), 0) + (user.carryOverXP || 0);
    
    const uniqueDays = new Set(connections.map(c => new Date(c.date).toDateString()));
    const streak = Array.from(uniqueDays).length;

    // Custom Tier Formula: Tier system based on Streak and Semester XP
    // Networth Power = SemesterXP + (Streak * 5)
    const networthPower = Math.max(0, semesterXP + (streak * 5));

    const pointsPerRank = 100;
    const actualRankIndex = Math.min(Math.floor(networthPower / pointsPerRank), RANKS.length - 1);
    const rank = RANKS[actualRankIndex];
    const progress = Math.min(100, (networthPower % pointsPerRank) || (networthPower > 0 ? 0 : 0));
    
    // Calculate next reset date
    const resetMonths = [4, 8, 12]; // May 1st, Sept 1st, Jan 1st
    const targetMonth = resetMonths[currentSeasonIdx - 1];
    const resetDate = new Date(currentYear, targetMonth, 1);
    if (resetDate <= now) resetDate.setFullYear(currentYear + 1);
    const diffDays = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return { 
      score: lifetimePoints, 
      monthlyScore, 
      yearlyScore, 
      lifetimePoints, 
      rank, 
      streak, 
      progress: networthPower % 100, 
      rankLevel: actualRankIndex + 1, 
      power: networthPower,
      season: seasonName,
      seasonId: currentSeasonId,
      nextReset: `${diffDays}d until reset`
    };
  }, [user, connections]);

  // Seasonal Reset Handler
  useEffect(() => {
    if (!user || !stats.seasonId) return;
    
    if (user.lastResetSeason && user.lastResetSeason !== stats.seasonId) {
      // Trigger Reset logic: derank by one and xp is cut in half
      // XP here refers to the power/points used for ranking
      const currentPower = stats.power;
      const newCarryOver = Math.max(0, (currentPower / 2) - 100); // -100 to force derank by 1 tier if they were just at threshold
      
      setUser(prev => prev ? ({
        ...prev,
        lastResetSeason: stats.seasonId,
        carryOverXP: newCarryOver
      }) : null);

      setShowPromo({ from: 'Seasonal Reset', to: RANKS[Math.max(0, stats.rankLevel - 2)].name });
    } else if (!user.lastResetSeason) {
      setUser(prev => prev ? ({ ...prev, lastResetSeason: stats.seasonId }) : null);
    }
  }, [stats.seasonId, user]);

  // Promotion Detector (Only show if Rank increases)
  useEffect(() => {
    if (!user) return;
    const lastRank = localStorage.getItem('last_known_rank');
    if (lastRank && lastRank !== stats.rank.name) {
      const oldIdx = RANKS.findIndex(r => r.name === lastRank);
      const newIdx = RANKS.findIndex(r => r.name === stats.rank.name);
      
      if (newIdx > oldIdx) {
        // Generate all intermediate rank-ups
        const intermediatePromos = [];
        for (let i = oldIdx; i < newIdx; i++) {
          intermediatePromos.push({ from: RANKS[i].name, to: RANKS[i + 1].name });
        }
        setPromoQueue(prev => [...prev, ...intermediatePromos]);
      }
    }
    localStorage.setItem('last_known_rank', stats.rank.name);
  }, [stats.rank.name, user]);

  // Queue Processor
  useEffect(() => {
    if (!showPromo && promoQueue.length > 0) {
      const [next, ...rest] = promoQueue;
      setShowPromo(next);
      setPromoQueue(rest);
    }
  }, [showPromo, promoQueue]);

  // Dynamic Theme Management
  useEffect(() => {
    if (stats.rank) {
      document.documentElement.style.setProperty('--tier-accent', stats.rank.hex);
      document.documentElement.style.setProperty('--tier-accent-glow', stats.rank.glow);
    }
  }, [stats.rank]);

  const handleOnboard = (name: string, careerGoal: string) => {
    setUser({
      name,
      careerGoal,
      startDate: new Date().toISOString()
    });
  };

  const updateGoal = (newGoal: string) => {
    if (user) {
      setUser({ ...user, careerGoal: newGoal });
    }
  };

  const addConnection = async (description: string) => {
    if (!user) return;
    
    try {
      const result = await analyzeNetworking(description, user.careerGoal);
      const newConn: Connection = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        description,
        ...result
      };
      setConnections([newConn, ...connections]);
      return newConn;
    } catch (error) {
      console.error("Failed to log connection:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Onboarding onComplete={handleOnboard} />;
  }

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-accent/30 selection:text-white">
      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        <Sidebar 
          user={user} 
          stats={stats} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          updateGoal={updateGoal} 
        />

        {/* Promotion Modal */}
        <AnimatePresence>
          {showPromo && (() => {
            const nextRank = RANKS.find(r => r.name === showPromo.to) || RANKS[0];
            const isLightRank = ['Silver', 'Platinum'].includes(nextRank.name);
            const isHighTier = ['Emerald', 'Ruby', 'Sapphire', 'Diamond', 'Obsidian', 'Platinum'].includes(nextRank.name);
            const isLegendary = ['Diamond', 'Obsidian', 'Platinum'].includes(nextRank.name);
            
            return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl overflow-hidden"
              >
                {/* Visual Effects Layer */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Atmospheric Glow */}
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-[80vw] h-[80vw] rounded-full blur-[100px]" style={{ background: nextRank.glow }} />
                  </motion.div>

                  {/* Prestige Particles */}
                  {isHighTier && [...Array(24)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        x: "50%", 
                        y: "50%", 
                        scale: 0,
                        rotate: 0,
                        opacity: 1
                      }}
                      animate={{ 
                        x: `${Math.random() * 100}%`, 
                        y: `${Math.random() * 100}%`,
                        scale: Math.random() * 1,
                        rotate: Math.random() * 360,
                        opacity: 0
                      }}
                      transition={{ 
                        duration: 1.5 + Math.random() * 2, 
                        repeat: Infinity,
                        delay: Math.random() * 1,
                        ease: "easeOut"
                      }}
                      className="absolute w-2 h-2 rounded-full"
                      style={{ background: nextRank.hex }}
                    >
                      <Star className="w-full h-full fill-current" />
                    </motion.div>
                  ))}

                  {/* Legendary Flash */}
                  {isLegendary && (
                    <motion.div 
                      initial={{ opacity: 1, scale: 0 }}
                      animate={{ opacity: 0, scale: 4 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-0 bg-white z-[101] mix-blend-overlay"
                    />
                  )}
                </div>

                <motion.div 
                  initial={{ scale: 0.5, y: 100, rotateX: 45 }}
                  animate={{ scale: 1, y: 0, rotateX: 0 }}
                  transition={{ type: "spring", damping: 15, stiffness: 100 }}
                  className="bg-surface border border-white/10 p-12 rounded-[50px] max-w-sm w-full text-center space-y-8 relative overflow-hidden shadow-2xl z-[102]"
                  style={{ '--color-accent': nextRank.hex, '--color-accent-glow': nextRank.glow } as React.CSSProperties}
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-accent shadow-[0_0_20px_var(--color-accent-glow)]" style={{ backgroundColor: nextRank.hex }} />
                  
                  <motion.div 
                   animate={{ 
                     rotateY: isLegendary ? [0, 360] : 0,
                     scale: [1, 1.1, 1]
                   }}
                   transition={{ 
                     rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                     scale: { duration: 2, repeat: Infinity }
                   }}
                   className={`w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto shadow-[0_0_40px_var(--color-accent-glow)] transition-colors duration-500
                    ${isLightRank ? 'bg-white' : ''}`}
                    style={{ backgroundColor: !isLightRank ? nextRank.hex : undefined }}
                    >
                     <nextRank.icon className={`w-12 h-12 ${isLightRank ? 'text-black' : 'text-white'}`} />
                  </motion.div>

                  <div className="space-y-2">
                    <motion.h3 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-[10px] font-black uppercase tracking-[0.5em]"
                      style={{ color: nextRank.hex }}
                    >
                      {isLegendary ? 'Ascension Complete' : 'New Milestone Unlocked'}
                    </motion.h3>
                    <motion.h2 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-4xl font-black uppercase tracking-tighter"
                    >
                      Tier <span style={{ color: nextRank.hex }}>{showPromo.to}</span>
                    </motion.h2>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="text-text-dim text-sm mt-6 leading-relaxed"
                    >
                      {isLegendary 
                        ? "You have breached the upper atmosphere of professional dominance." 
                        : "Your professional magnetism has evolved."} <br/>
                      <span className="text-white font-medium">Level {RANKS.findIndex(r => r.name === showPromo.to) + 1}</span> Access Granted.
                    </motion.p>
                  </div>

                  <motion.button 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    onClick={() => setShowPromo(null)}
                    className="w-full text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:brightness-110 transition-all shadow-xl active:scale-[0.98] mt-4"
                    style={{ backgroundColor: nextRank.hex }}
                  >
                    Accept Dominance
                  </motion.button>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-grow bg-bg overflow-y-auto relative no-scrollbar">
          <div className="atmosphere-glow absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] blur-[120px] opacity-40 pointer-events-none" />
          <div className="relative z-10 p-8 md:p-12 max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <Dashboard 
                  user={user} 
                  stats={stats} 
                  onSubmit={addConnection} 
                />
              )}
              {activeTab === 'friends' && (
                <Friends 
                  friends={MOCK_FRIENDS} 
                  currentRank={stats.rank.name} 
                  onFriendClick={(f) => setSelectedFriend(f)}
                />
              )}
              {activeTab === 'connections' && (
                <Connections connections={connections} />
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Friend Detail Modal */}
        <AnimatePresence>
          {selectedFriend && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
              onClick={() => setSelectedFriend(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-surface border border-border-dim w-full max-w-lg rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {/* Profile Header */}
                <div className="relative h-32 bg-accent/20">
                   <div className="absolute inset-0 atmosphere-glow opacity-30" />
                   <div className="absolute -bottom-12 left-8 border-[6px] border-surface rounded-full">
                      <img src={selectedFriend.avatar} className="w-24 h-24 rounded-full object-cover" alt={selectedFriend.name} referrerPolicy="no-referrer" />
                   </div>
                   <button 
                     onClick={() => setSelectedFriend(null)}
                     className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 border border-border-dim flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                   >
                     &times;
                   </button>
                </div>

                <div className="pt-16 px-8 pb-8 space-y-8">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">{selectedFriend.name}</h2>
                    <div className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest
                      ${RANKS.find(r => r.name === selectedFriend.rank)?.bg} 
                      ${RANKS.find(r => r.name === selectedFriend.rank)?.color} 
                      ${RANKS.find(r => r.name === selectedFriend.rank)?.border}`}>
                       {selectedFriend.rank} Tier
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex bg-black/40 border border-border-dim rounded-xl p-1">
                      {['monthly', 'yearly', 'lifetime'].map((view) => (
                        <button
                          key={view}
                          onClick={() => setFriendScoreView(view as any)}
                          className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${friendScoreView === view ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-dim hover:text-white'}`}
                        >
                          {view}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/20 border border-border-dim rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                         <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-text-dim mb-1 relative z-10">
                           {friendScoreView === 'monthly' ? 'Monthly' : friendScoreView === 'yearly' ? 'Yearly' : 'Lifetime'} Score
                         </span>
                         <motion.span 
                           key={friendScoreView}
                           initial={{ y: 10, opacity: 0 }}
                           animate={{ y: 0, opacity: 1 }}
                           className="text-3xl font-black text-accent relative z-10"
                         >
                           {friendScoreView === 'monthly' ? selectedFriend.monthlyScore : friendScoreView === 'yearly' ? selectedFriend.yearlyScore : selectedFriend.score}
                         </motion.span>
                      </div>
                      <div className="bg-black/20 border border-border-dim rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                         <span className="text-[10px] font-black uppercase tracking-widest text-text-dim mb-1">Active Streak</span>
                         <div className="flex items-center gap-2">
                           <Flame className="w-5 h-5 text-orange-500 fill-current" />
                           <span className="text-3xl font-black text-white">{selectedFriend.streak}d</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim border-b border-border-dim pb-2 flex items-center gap-2">
                       Recent Telemetry <History className="w-3 h-3" />
                    </h3>
                    <div className="space-y-3">
                      {selectedFriend.recentEvents.map(event => (
                        <div key={event.id} className="flex justify-between items-start group">
                           <div className="flex-grow">
                             <p className="text-xs font-bold text-white group-hover:text-accent transition-colors leading-tight">{event.description}</p>
                             <span className="text-[9px] text-text-dim uppercase tracking-wider">{new Date(event.date).toLocaleDateString()}</span>
                           </div>
                           <div className={`text-[10px] font-black ${event.points < 0 ? 'text-red-500' : 'text-accent'}`}>{event.points > 0 ? '+' : ''}{event.points} XP</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button className="w-full bg-surface-bright border border-border-dim text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-colors">
                      Send Connection Request
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Rail - Desktop Only */}
        <section className="hidden xl:flex w-72 bg-bg border-l border-border-dim p-8 flex-col gap-8 flex-shrink-0 overflow-y-auto no-scrollbar">
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-dim block font-black">Ranking Ladder</span>
            <div className="flex flex-col gap-2">
              {[...RANKS].reverse().map((rank, idx) => {
                const rankIdx = RANKS.length - 1 - idx;
                const threshold = rankIdx * 100;
                const isCurrent = stats.rank.name === rank.name;
                const isNext = rankIdx === stats.rankLevel; // rankLevel is current index + 1
                const isClose = isNext && stats.progress > 80;

                return (
                  <div 
                    key={rank.name}
                    className={`flex justify-between items-center text-[10px] px-3 py-3 rounded-xl border transition-all duration-300
                      ${isCurrent 
                        ? `bg-white/10 border-accent/60 ${rank.color} font-black ring-1 ring-accent/30 shadow-[0_0_20px_var(--color-accent-glow)]` 
                        : isNext && isClose
                          ? `bg-accent/20 border-accent animate-blink-fast text-white font-black shadow-[0_0_15px_var(--color-accent-glow)]`
                          : isNext
                            ? `bg-surface-bright border-white/20 text-white font-bold`
                            : 'bg-surface border-white/5 text-text-dim opacity-70'}`}
                  >
                    <div className="flex items-center gap-2">
                       <rank.icon className={`w-3 h-3 ${isCurrent ? rank.color : 'text-current opacity-50'}`} />
                       <span className="uppercase tracking-widest">{rank.name}</span>
                    </div>
                    <span className="font-mono">{threshold}XP+</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-dim block font-black">Top Hustlers</span>
            <div className="flex flex-col gap-4">
              {MOCK_FRIENDS.slice(0, 4).map(friend => (
                <div key={friend.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-bright border border-border-dim flex items-center justify-center text-[10px] font-bold text-white">
                    {friend.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-grow">
                    <div className="text-[12px] font-bold text-white">{friend.name}</div>
                    <div className="text-[9px] text-text-dim uppercase tracking-wider">{friend.rank} Rank</div>
                  </div>
                  <div className="text-[12px] font-bold text-accent">{friend.score.toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// --- Sub-components ---

function Sidebar({ user, stats, activeTab, setActiveTab, updateGoal }: { user: User, stats: any, activeTab: string, setActiveTab: (t: any) => void, updateGoal: (g: string) => void }) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editGoalValue, setEditGoalValue] = useState(user.careerGoal);

  const handleSaveGoal = () => {
    updateGoal(editGoalValue);
    setIsEditingGoal(false);
  };

  return (
    <aside className="w-full md:w-60 bg-bg md:border-r border-border-dim p-6 flex flex-col gap-8 flex-shrink-0">
      <div className="flex items-center gap-2 text-xl font-black tracking-widest text-white">
        <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_10px_inner_var(--color-accent)] shadow-accent" />
        NETWORTH
      </div>
      
      <nav className="flex flex-col gap-2">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Dashboard" />
        <NavButton active={activeTab === 'connections'} onClick={() => setActiveTab('connections')} icon={History} label="Connections" />
        <NavButton active={activeTab === 'friends'} onClick={() => setActiveTab('friends')} icon={Users} label="Friends" />
      </nav>

      <div className="mt-auto p-4 bg-surface border border-border-dim rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] uppercase tracking-widest text-text-dim block">Target Goal</span>
          <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="hover:text-accent text-text-dim transition-colors">
            <Pencil className="w-3 h-3" />
          </button>
        </div>
        
        {isEditingGoal ? (
          <div className="flex flex-col gap-2">
            <input 
              autoFocus
              value={editGoalValue}
              onChange={e => setEditGoalValue(e.target.value)}
              className="bg-black/40 border border-border-dim rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button onClick={handleSaveGoal} className="text-[10px] font-bold text-accent border border-accent/20 rounded py-1 hover:bg-accent/10 transition-colors">
              Save
            </button>
          </div>
        ) : (
          <div className="text-xs font-bold text-accent truncate">{user.careerGoal}</div>
        )}
        
        <div className="w-full h-1 bg-black/40 mt-3 rounded-full overflow-hidden border border-white/5">
          <div 
            className={`h-full bg-accent rounded-full ${stats.progress > 80 ? 'animate-pulse shadow-[0_0_8px_var(--color-accent)]' : ''}`} 
            style={{ width: `${Math.min(100, (stats.power % 100) || (stats.power > 0 ? 100 : 0))}%` }} 
          />
        </div>
        <div className="mt-1 flex justify-between text-[8px] font-black uppercase tracking-tighter">
           <span className={stats.progress > 80 ? 'text-accent animate-blink-fast' : 'text-text-dim'}>Lv. {stats.rankLevel}</span>
           <span className="text-text-dim">{Math.floor(stats.power % 100)}/100XP</span>
        </div>
      </div>

      <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex items-center gap-2 text-xs font-bold text-text-dim hover:text-white transition-colors px-2 py-4">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </aside>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`relative px-4 py-3 transition-all duration-300 group flex items-center gap-3 w-full
        ${active ? 'text-white border-l-2 border-accent pl-6' : 'text-text-dim hover:text-white/70'}`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'scale-100 group-hover:scale-105'}`} />
      <span className="text-[12px] font-bold uppercase tracking-wider">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-pill"
          className="absolute inset-0 bg-white/5 rounded-r-xl -z-10"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}

function Onboarding({ onComplete }: { onComplete: (name: string, goal: string) => void }) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 overflow-hidden relative">
      <div className="atmosphere-glow absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface backdrop-blur-2xl border border-border-dim p-10 rounded-[32px] shadow-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-accent/40">
            <Trophy className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight uppercase">Networth.</h1>
          <p className="text-text-dim text-sm">Let's map your professional hustle.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim block px-1">Indentity</label>
            <input 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="What do we call you?"
              className="w-full bg-black/40 border border-border-dim rounded-xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-text-dim/30 text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim block px-1">Ambition</label>
            <input 
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="e.g. Software Engineer Intern @ Google"
              className="w-full bg-black/40 border border-border-dim rounded-xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-text-dim/30 text-sm"
            />
          </div>

          <button 
            disabled={!name || !goal}
            onClick={() => onComplete(name, goal)}
            className="w-full bg-accent hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            Enter the Arena <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Dashboard({ user, stats, onSubmit }: { user: User, stats: any, onSubmit: (d: string) => Promise<any> }) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [scoreView, setScoreView] = useState<'power' | 'monthly' | 'yearly' | 'lifetime'>('power');

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setIsSubmitting(true);
    const res = await onSubmit(description);
    setLastResult(res);
    setIsSubmitting(false);
    setDescription('');
    setTimeout(() => setLastResult(null), 8000);
  };

  const getMainScore = () => {
    switch (scoreView) {
      case 'monthly': return { val: stats.monthlyScore, label: 'Monthly Score' };
      case 'yearly': return { val: stats.yearlyScore, label: 'Yearly Score' };
      case 'lifetime': return { val: stats.lifetimePoints, label: 'Lifetime Score' };
      default: return { val: stats.power, label: 'Hustle Score' };
    }
  };

  const mainScore = getMainScore();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-12"
    >
      {/* Immersive Score Display */}
      <div className="text-center relative py-4 flex flex-col items-center">
        <div className={`flex items-center gap-2 transition-all duration-500 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full ${scoreView !== 'power' ? 'mb-10' : 'mb-4'}`}>
           <span className="text-[10px] font-black uppercase tracking-widest text-accent">{stats.season}</span>
           <div className="w-1 h-1 bg-white/20 rounded-full" />
           <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">{stats.nextReset}</span>
        </div>

        <motion.div 
          key={scoreView}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center group relative"
        >
          {scoreView !== 'power' && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setScoreView('power')}
              className="absolute -top-10 bg-accent/20 border border-accent/40 text-[8px] font-black text-accent uppercase tracking-widest px-3 py-1 rounded-full hover:bg-accent hover:text-white transition-all backdrop-blur-sm shadow-lg whitespace-nowrap flex items-center gap-1.5"
            >
              <ArrowLeft className="w-2.5 h-2.5" /> Return to Hustle Score
            </motion.button>
          )}
          <h2 className={`hustle-score-text text-[110px] font-black leading-none select-none tracking-tighter cursor-pointer active:scale-95 transition-transform ${mainScore.val < 0 ? 'text-red-500' : ''}`}
            onClick={() => setScoreView('power')}
          >
            {mainScore.val.toFixed(0)}
          </h2>
          <div className="text-text-dim text-[10px] font-black uppercase tracking-[0.6em] mt-[-10px] mb-6">
             {mainScore.label}
          </div>
        </motion.div>
        
        <div className="grid grid-cols-3 gap-8 w-full max-w-lg mb-12">
           <button 
             onClick={() => setScoreView('monthly')}
             className={`space-y-1 p-3 rounded-2xl transition-all ${scoreView === 'monthly' ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`}
           >
              <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">Monthly</span>
              <div className="text-xl font-black text-white">{stats.monthlyScore.toFixed(0)}</div>
           </button>
           <button 
             onClick={() => setScoreView('yearly')}
             className={`space-y-1 p-3 rounded-2xl transition-all ${scoreView === 'yearly' ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`}
           >
              <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">Yearly</span>
              <div className="text-xl font-black text-white">{stats.yearlyScore.toFixed(0)}</div>
           </button>
           <button 
             onClick={() => setScoreView('lifetime')}
             className={`space-y-1 p-3 rounded-2xl transition-all ${scoreView === 'lifetime' ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`}
           >
              <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">Lifetime</span>
              <div className="text-xl font-black text-accent">{stats.lifetimePoints.toFixed(0)}</div>
           </button>
        </div>

        <button 
          onClick={() => setScoreView('power')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full border ${stats.rank.border} ${stats.rank.bg} ${stats.rank.color} text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all duration-700
            ${scoreView === 'power' ? 'scale-110 ring-2 ring-accent/40' : 'opacity-80 hover:opacity-100 hover:scale-105'}`}
        >
          <stats.rank.icon className="w-4 h-4" />
          {stats.rank.name} Tier
        </button>

        <div className="mt-8 w-64 space-y-2">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest px-1">
            <span className={stats.progress > 80 ? 'text-accent animate-blink-fast' : 'text-text-dim'}>
              {stats.progress > 80 ? 'CRITICAL LEVEL UP' : 'Tier Ascension'}
            </span>
            <span className="text-text-dim">{Math.floor(stats.power % 100)}/100 XP</span>
          </div>
          <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-border-dim shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, stats.progress)}%` }}
              className={`h-full bg-accent shadow-[0_0_15px_var(--color-accent)] ${stats.progress > 80 ? 'animate-pulse' : ''}`}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-3 px-6 py-3 bg-accent/10 border border-accent/20 rounded-xl w-fit mx-auto mt-10 backdrop-blur-sm group">
          <Flame className="w-4 h-4 text-orange-500 fill-current group-hover:animate-bounce" />
          <span className="text-xs font-black uppercase tracking-widest">
            {stats.streak} DAY STREAK 
            <span className="ml-2 px-2 py-0.5 bg-accent/20 rounded text-[9px] text-accent border border-accent/30">+{stats.streak * 5} PTS</span>
          </span>
        </div>
      </div>

      {/* AI Result Feedback (Immediate) */}
      <AnimatePresence>
        {lastResult && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className={`p-5 rounded-2xl border transition-colors ${lastResult.points < 0 ? 'bg-red-500/10 border-red-500/40' : lastResult.isRelevant ? 'bg-accent/10 border-accent/40' : 'bg-surface border-border-dim'} flex gap-5 items-start shadow-2xl`}>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm shadow-lg ${lastResult.points < 0 ? 'bg-red-500 text-white' : 'bg-accent text-white'}`}>
                 {lastResult.points > 0 ? '+' : ''}{lastResult.points}
               </div>
               <div className="space-y-1.5 flex-grow">
                 <div className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                   <span className={lastResult.points < 0 ? 'text-red-500' : 'text-accent'}>
                     {lastResult.points < 0 ? 'STATUS UPDATE: SETBACK' : 'ANALYSIS SUCCESS'}
                   </span>
                   {lastResult.isRelevant && lastResult.points > 0 && <span className="bg-accent px-1.5 py-0.5 text-[8px] text-white rounded font-black tracking-widest italic animate-pulse">RELEVANCE x1.5</span>}
                 </div>
                 <p className="text-xs text-text-dim leading-relaxed font-medium italic">"{lastResult.feedback}"</p>
               </div>
               <button onClick={() => setLastResult(null)} className="text-text-dim hover:text-white transition-colors p-1">
                 <Check className="w-5 h-5" />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Log Area */}
      <div className="bg-surface border border-border-dim rounded-[20px] p-8 space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-black tracking-widest text-text-dim">Quick Log Connection</span>
          <div className="flex items-center gap-2 opacity-50">
             <BrainCircuit className="w-4 h-4" />
             <span className="text-[9px] font-bold uppercase tracking-widest">Gemini 1.5 Protocol</span>
          </div>
        </div>

        <textarea 
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Who did you meet? What core insights were shared?"
          className="w-full h-32 bg-black/30 border border-border-dim rounded-xl p-5 focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-text-dim/20 text-sm leading-relaxed resize-none"
        />

        <div className="flex justify-between items-center">
           <div className="text-[10px] text-text-dim/40 font-mono italic">Encryption locked by career goal: {user.careerGoal}</div>
           <button 
              disabled={isSubmitting || !description.trim()}
              onClick={handleSubmit}
              className="bg-accent text-white font-black px-8 py-3 rounded-lg hover:brightness-110 transition-all flex items-center gap-2 uppercase tracking-widest text-[11px] disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze Potential"}
            </button>
        </div>
      </div>

      {/* AI Result Card */}
      <AnimatePresence>
        {lastResult && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="bg-surface border border-border-dim rounded-[20px] p-6 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-text-dim mb-4">Recent Multiplier</span>
              <div className="text-2xl font-black">{lastResult.isRelevant ? '1.5x Relevance' : 'Base Score'}</div>
              <p className="text-[10px] text-text-dim mt-2">Matched ambition: "{user.careerGoal.split(' ').slice(-1).join('')}" keywords observed.</p>
            </div>
            
            <div className="bg-surface border border-border-dim rounded-[20px] p-6 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-text-dim mb-4">AI Intelligence</span>
              <div className={`text-2xl font-black ${lastResult.points < 0 ? 'text-red-500' : 'text-white'}`}>{lastResult.points > 0 ? '+' : ''}{lastResult.points} Potential</div>
              <p className="text-[10px] text-text-dim mt-2 italic leading-relaxed font-medium">"{lastResult.feedback}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Connections({ connections }: { connections: Connection[] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <header className="space-y-1">
        <p className="text-accent font-bold text-[10px] tracking-[0.3em] uppercase">Archive // Telemetry</p>
        <h2 className="text-4xl font-black tracking-tight uppercase">Live Logs.</h2>
      </header>

      {connections.length === 0 ? (
        <div className="bg-surface rounded-[32px] border border-border-dim p-20 text-center">
          <History className="w-12 h-12 text-text-dim/20 mx-auto mb-6" />
          <h3 className="text-xl font-bold mb-2">No history found.</h3>
          <p className="text-text-dim text-sm px-8">Start logging your networking events to build your hustle score.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((c, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={c.id}
              className="bg-surface hover:bg-surface-bright transition-all p-5 rounded-2xl border border-border-dim flex flex-col md:flex-row md:items-center gap-6 group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors
                ${c.quality === 'High' ? 'bg-accent/10 border-accent/20 text-accent' : 
                  c.quality === 'Medium' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 
                  'bg-surface-bright border-border-dim text-text-dim'}`}>
                {c.isRelevant ? <Zap className="w-6 h-6" /> : <Users className="w-6 h-6" />}
              </div>

              <div className="flex-grow space-y-1">
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">{new Date(c.date).toLocaleDateString()}</span>
                   <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest
                     ${c.quality === 'High' ? 'bg-accent/20 text-accent' : 'bg-surface-bright text-text-dim'}`}>
                     {c.quality} Quality
                   </span>
                </div>
                <p className="text-white text-sm font-medium line-clamp-1 group-hover:text-accent transition-colors">{c.description}</p>
                <p className="text-[10px] text-text-dim italic">"{c.feedback}"</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className={`text-xl font-black ${c.points < 0 ? 'text-red-500' : 'text-white'}`}>
                  {c.points > 0 ? '+' : ''}{c.isRelevant ? (c.points * 1.5).toFixed(0) : c.points} <span className="text-[9px] uppercase font-black text-text-dim">PTS</span>
                </p>
                {c.isRelevant && c.points > 0 && <p className="text-[9px] text-accent font-black uppercase tracking-widest">Relevance Boost</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function Friends({ friends, currentRank, onFriendClick }: { friends: Friend[], currentRank: string, onFriendClick: (f: Friend) => void }) {
  const [leaderboardView, setLeaderboardView] = useState<'monthly' | 'yearly' | 'lifetime'>('lifetime');
  
  const getScore = (f: Friend) => {
    switch (leaderboardView) {
      case 'monthly': return f.monthlyScore;
      case 'yearly': return f.yearlyScore;
      default: return f.score;
    }
  };

  const sortedFriends = [...friends].sort((a, b) => getScore(b) - getScore(a));

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-8"
    >
      <header className="space-y-1">
        <p className="text-accent font-bold text-[10px] tracking-[0.3em] uppercase">Community // Competitive</p>
        <h2 className="text-4xl font-black tracking-tight uppercase">Leaderboard.</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-text-dim flex items-center gap-2">
              Global Rankings <TrendingUp className="w-4 h-4" />
            </h3>
            <div className="flex bg-black/40 border border-border-dim rounded-lg p-0.5">
              {['monthly', 'yearly', 'lifetime'].map((view) => (
                <button
                  key={view}
                  onClick={() => setLeaderboardView(view as any)}
                  className={`px-3 py-1 text-[7px] font-black uppercase tracking-widest rounded-md transition-all ${leaderboardView === view ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-dim hover:text-white'}`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-3xl border border-border-dim overflow-hidden divide-y divide-border-dim">
            {sortedFriends.map((f, i) => (
              <div 
                key={f.id} 
                onClick={() => onFriendClick(f)}
                className="p-5 flex items-center gap-4 hover:bg-surface-bright transition-colors group cursor-pointer"
              >
                <div className="w-6 font-mono text-sm font-black text-text-dim/40 group-hover:text-accent transition-colors">0{i + 1}</div>
                <img src={f.avatar} className="w-10 h-10 rounded-full border border-border-dim shadow-lg" alt={f.name} referrerPolicy="no-referrer" />
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm">{f.name}</p>
                    {f.streak > 7 && <Flame className="w-3 h-3 text-orange-500 fill-current animate-pulse" />}
                  </div>
                  <p className={`text-[9px] font-black uppercase tracking-wider ${RANKS.find(r => r.name === f.rank)?.color}`}>
                    {f.rank} Tier
                  </p>
                </div>
                <div className="text-right">
                  <motion.p 
                    key={leaderboardView}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-lg font-black text-accent"
                  >
                    {getScore(f).toFixed(0)}
                  </motion.p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-border-dim rounded-[32px] p-8 space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] pointer-events-none group-hover:bg-accent/10 transition-colors" />
            <h3 className="text-2xl font-black tracking-tight leading-tight uppercase relative z-10">Dominance Metric.</h3>
            
            <div className="bg-black/40 p-6 rounded-2xl space-y-4 relative z-10 border border-border-dim">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-text-dim">Current Tier</span>
                <span className="text-accent">{currentRank}</span>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-accent w-[45%] shadow-[0_0_10px_var(--color-accent)]" />
              </div>
              <p className="text-[9px] font-bold text-text-dim/80 leading-relaxed">System identifies your profile in the top 12% of active student hustlers globally.</p>
            </div>

            <button className="w-full bg-accent text-white py-4 rounded-xl font-black tracking-widest uppercase text-[10px] hover:brightness-110 transition-all flex items-center justify-center gap-3 relative z-10 shadow-lg shadow-accent/20">
              Colleague Search <Users className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-surface border border-border-dim p-6 rounded-[32px] space-y-3">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
               <h4 className="font-black text-[9px] tracking-[0.2em] uppercase text-text-dim">Daily Intelligence</h4>
            </div>
            <p className="text-xs text-white/50 leading-relaxed italic font-medium">"Leverage your ambition to filter your network. High-value connections are found where specific career interests intersect."</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

