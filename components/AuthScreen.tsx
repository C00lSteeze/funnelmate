
import React, { useState } from 'react';
import { Wand2, ArrowRight, Lock, Mail, ExternalLink, CreditCard, CheckCircle2, AlertTriangle, XCircle, Cloud } from 'lucide-react';
import { UserProfile } from '../types';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../src/lib/firebase';

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<{ type: 'NOT_FOUND' | 'PLAN_INACTIVE' | 'INVALID_PASS' | 'CONFIG_ERROR' | null, message: string }>({ type: null, message: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorState({ type: null, message: '' });
    setIsLoading(true);

    // DEMO MODE CHECK
    // If Firebase isn't set up yet, we allow the demo user to pass through for testing.
    if (!auth) {
        if (email === 'demo@funnelmate.com' && password === '123456') {
             setTimeout(() => {
                onLogin({
                    name: 'Demo User',
                    email: email,
                    avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${email}`,
                    plan: 'pro',
                    subscriptionExpiry: Date.now() + 31536000000 
                });
             }, 1000);
             return;
        } else {
            setErrorState({ type: 'CONFIG_ERROR', message: "Firebase not configured. Use demo credentials." });
            setIsLoading(false);
            return;
        }
    }

    try {
      // 1. Firebase Auth: Check if account exists & password matches
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Firestore: Check user profile for Plan Status
      // Assuming your external website creates a document in 'users' collection with the same UID
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
          const userData = docSnap.data();
          
          if (userData.plan === 'pro' || userData.plan === 'premium') {
              // SUCCESS: Plan is active
              onLogin({
                  name: userData.name || user.displayName || 'Member',
                  email: user.email || '',
                  avatar: userData.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${user.email}`,
                  plan: 'pro',
                  subscriptionExpiry: userData.subscriptionExpiry
              });
          } else {
              // FAILURE: Plan is free/inactive
              await signOut(auth); // Force logout
              setErrorState({ 
                  type: 'PLAN_INACTIVE', 
                  message: "Your 1-Year Plan is not active. Please complete payment on our website." 
              });
          }
      } else {
           // Edge case: Auth exists but no Firestore doc (maybe signup failed halfway)
           await signOut(auth);
           setErrorState({ 
              type: 'NOT_FOUND', 
              message: "Profile data not found. Please contact support." 
           });
      }

    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          setErrorState({ type: 'NOT_FOUND', message: "Invalid email or password." });
      } else if (err.code === 'auth/wrong-password') {
           setErrorState({ type: 'INVALID_PASS', message: "Incorrect password." });
      } else {
          setErrorState({ type: null, message: "Connection error. Please try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpRedirect = () => {
    // Redirect to your external sales page/website
    const externalUrl = "https://funnelmate.ai/get-started"; 
    window.open(externalUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors">
      
      {/* Brand Header */}
      <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4 shadow-xl shadow-blue-500/20">
          <Wand2 className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">FunnelMate AI</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Your Affiliate Marketing Copilot</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Login Form Section */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            Member Login
            {!auth && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Demo Mode</span>}
          </h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>

            {/* Error Handling UI */}
            {errorState.message && (
              <div className={`text-xs p-3 rounded-lg flex items-start gap-2 ${
                errorState.type === 'NOT_FOUND' || errorState.type === 'PLAN_INACTIVE' 
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300'
              }`}>
                {errorState.type === 'NOT_FOUND' || errorState.type === 'PLAN_INACTIVE' ? <AlertTriangle size={16} className="shrink-0" /> : <XCircle size={16} className="shrink-0" />}
                <div className="flex-1">
                  <p className="font-medium">{errorState.message}</p>
                  
                  {/* Contextual Actions based on Error */}
                  {errorState.type === 'NOT_FOUND' && (
                    <button 
                      type="button"
                      onClick={handleSignUpRedirect}
                      className="mt-1 underline font-bold hover:text-orange-900 dark:hover:text-orange-100"
                    >
                      Go to Sign Up Page &rarr;
                    </button>
                  )}
                  {errorState.type === 'PLAN_INACTIVE' && (
                    <button 
                      type="button"
                      onClick={handleSignUpRedirect}
                      className="mt-1 underline font-bold hover:text-orange-900 dark:hover:text-orange-100"
                    >
                      Activate Plan Now &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Verifying Account...' : 'Access Dashboard'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-6 text-center">
             <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors">Forgot Password?</button>
          </div>
        </div>

        {/* Sign Up / Activation Section */}
        <div className="bg-gray-50 dark:bg-gray-700/30 p-6 border-t border-gray-100 dark:border-gray-700">
           <div className="flex items-start gap-4">
              <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                  <CreditCard size={20} />
              </div>
              <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Don't have an account?</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
                    Sign up on our website and activate your <strong>1-Year Unlimited Plan</strong>.
                  </p>
                  
                  <button 
                    onClick={handleSignUpRedirect}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group"
                  >
                    Create Account & Activate Plan <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
              </div>
           </div>
        </div>
      </div>
      
      {/* DEMO INSTRUCTIONS (Hidden if firebase is configured) */}
      {!auth && (
          <div className="mt-8 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 max-w-sm text-center">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Demo Credentials:</strong><br/>
              Email: demo@funnelmate.com<br/>
              Password: 123456
            </p>
          </div>
      )}

      {/* Cloud Indicator */}
      <div className="mt-8 flex items-center gap-2 text-[10px] text-gray-400">
         <Cloud size={12} />
         <span>Powered by Google Cloud Platform & Gemini AI</span>
      </div>

    </div>
  );
};

export default AuthScreen;
