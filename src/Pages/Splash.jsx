import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    
    // Use Firebase's onAuthStateChanged to wait for auth to initialize
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      // Wait 1 second for splash animation, then check auth
      timer = setTimeout(() => {
        checkAuthAndRoute(firebaseUser);
      }, 1000);
    });
    
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [navigate]);

  const checkAuthAndRoute = (firebaseUser) => {
    if (!firebaseUser) {
      console.log("❌ No Firebase → Signin");
      navigate("/signin");
      return;
    }

    console.log("✅ Firebase → Welcome");
    navigate("/welcome");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 flex items-center justify-center p-6">
      <div className="relative text-center space-y-8">
        {/* GoFast Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute -top-8 -left-8 text-5xl animate-bounce">🏃‍♂️</div>
            <div className="absolute -top-6 -right-8 text-4xl animate-bounce" style={{ animationDelay: '0.3s' }}>⚡</div>
            <div className="absolute -bottom-4 -left-6 text-3xl animate-bounce" style={{ animationDelay: '0.5s' }}>🏆</div>
            
            <div className="w-32 h-32 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-2xl">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl font-black text-white drop-shadow-2xl">
            GoFast
          </h1>
          <p className="text-2xl text-white/90 font-medium drop-shadow-lg">
            Crush your goals with the ultimate running community
          </p>
        </div>

        <div className="flex justify-center pt-8">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
