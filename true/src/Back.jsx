// App.js
import React, { useState, useEffect } from 'react';

const TrueTalkComingSoon = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [subscribedCount, setSubscribedCount] = useState(1842);
  const [currentTagline, setCurrentTagline] = useState(0);

  const taglines = [
    "Where Conversations Become Connections",
    "Secure Messaging for Modern Enterprises", 
    "The Future of Business Communication",
    "Intelligent Conversations, Powerful Results",
    "Enterprise-Grade Security Meets Seamless Chat"
  ];

  useEffect(() => {
    const calculateTimeLeft = () => {
      const launchDate = new Date('December 31, 2024 23:59:59').getTime();
      const now = new Date().getTime();
      const difference = launchDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    // Rotate taglines
    const taglineInterval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(taglineInterval);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setSubscribedCount(prev => prev + 1);
      setEmail('');
      setTimeout(() => setIsSubmitted(false), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 text-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Orange & White Animated Background */}
      <div className="absolute inset-0">
        
        {/* Animated Connection Lines */}
        <div className="absolute inset-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-orange-300/40 to-transparent animate-connection-line"
              style={{
                top: `${20 + i * 6}%`,
                left: '0%',
                width: '100%',
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${8 + i * 2}s`
              }}
            />
          ))}
        </div>

        {/* Floating Business Cards */}
        <div className="absolute top-1/4 left-1/6 w-16 h-10 bg-gradient-to-r from-orange-400/20 to-amber-400/20 rounded-lg shadow-lg animate-business-card-1 border border-orange-300/30"></div>
        <div className="absolute top-1/3 right-1/5 w-20 h-12 bg-gradient-to-r from-amber-500/20 to-orange-400/20 rounded-lg shadow-lg animate-business-card-2 border border-amber-300/30"></div>
        <div className="absolute bottom-1/4 left-1/4 w-14 h-8 bg-gradient-to-r from-orange-500/20 to-amber-400/20 rounded-lg shadow-lg animate-business-card-3 border border-orange-300/30"></div>
        <div className="absolute bottom-1/3 right-1/6 w-18 h-10 bg-gradient-to-r from-amber-600/20 to-orange-400/20 rounded-lg shadow-lg animate-business-card-4 border border-amber-300/30"></div>

        {/* Data Flow Particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-data-flow"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 15}s`,
                animationDuration: `${10 + Math.random() * 20}s`
              }}
            />
          ))}
        </div>

        {/* Pulsing Network Nodes */}
        <div className="absolute top-1/5 left-1/5 w-3 h-3 bg-amber-400 rounded-full animate-node-pulse-1 shadow-lg shadow-amber-400/30"></div>
        <div className="absolute top-2/5 right-1/4 w-3 h-3 bg-orange-400 rounded-full animate-node-pulse-2 shadow-lg shadow-orange-400/30"></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-orange-500 rounded-full animate-node-pulse-3 shadow-lg shadow-orange-500/30"></div>
        <div className="absolute bottom-1/4 right-1/5 w-3 h-3 bg-amber-500 rounded-full animate-node-pulse-4 shadow-lg shadow-amber-500/30"></div>

        {/* Animated Circuit Patterns */}
        <div className="absolute top-10 left-20 w-32 h-20 border-2 border-orange-300/20 rounded-xl animate-circuit-float-1">
          <div className="absolute top-2 left-2 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-2 right-2 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
        </div>
        <div className="absolute bottom-20 right-32 w-24 h-16 border-2 border-amber-400/20 rounded-xl animate-circuit-float-2">
          <div className="absolute top-2 right-2 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-2 left-2 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
        </div>

        {/* Floating Message Bubbles */}
        <div className="absolute top-40 left-32 w-8 h-8 bg-gradient-to-br from-orange-400/30 to-amber-300/30 rounded-full animate-message-float-1 shadow-lg"></div>
        <div className="absolute top-60 right-40 w-6 h-6 bg-gradient-to-br from-amber-400/30 to-orange-300/30 rounded-full animate-message-float-2 shadow-lg"></div>
        <div className="absolute bottom-40 left-40 w-7 h-7 bg-gradient-to-br from-orange-500/30 to-amber-300/30 rounded-full animate-message-float-3 shadow-lg"></div>

        {/* Animated Security Shields */}
        <div className="absolute top-1/4 right-32 text-2xl opacity-20 animate-shield-float-1">🛡️</div>
        <div className="absolute bottom-1/3 left-48 text-2xl opacity-20 animate-shield-float-2">🔒</div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/3 left-10 w-64 h-64 bg-gradient-to-r from-orange-400/10 to-amber-400/10 rounded-full blur-3xl animate-orb-float-1"></div>
        <div className="absolute bottom-1/4 right-16 w-56 h-56 bg-gradient-to-r from-amber-500/10 to-orange-400/10 rounded-full blur-3xl animate-orb-float-2"></div>
        <div className="absolute top-2/3 left-2/3 w-48 h-48 bg-gradient-to-r from-orange-500/10 to-amber-400/10 rounded-full blur-3xl animate-orb-float-3"></div>

        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 animate-grid-flow"></div>
        </div>

      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl w-full text-center">
        
        {/* Enhanced Main Header with Highlighted TrueTalk */}
        <div className="mb-12 animate-fade-in-up">
          {/* Premium Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold mb-8 shadow-lg border border-amber-400/30">
            <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
            ENTERPRISE MESSAGING PLATFORM • COMING SOON
          </div>

          {/* Main TrueTalk Logo - HIGHLIGHTED */}
          <div className="relative mb-8">
            <div className="flex items-center justify-center space-x-6">
              <div className="text-6xl bg-gradient-to-br from-orange-500 via-amber-400 to-orange-600 rounded-3xl p-5 shadow-2xl animate-logo-glow relative z-10 border border-amber-400/30">
                💬
              </div>
              <div className="relative">
                {/* Glow Effect Behind Text */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-amber-400/30 to-orange-500/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
                
                {/* Main TrueTalk Heading */}
                <h1 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-gray-900 via-orange-700 to-amber-700 bg-clip-text text-transparent relative z-10 animate-text-glow leading-tight">
                  TrueTalk
                </h1>
                
                {/* Subtitle with dots */}
                <div className="flex items-center justify-center space-x-4 mt-4 relative z-10">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50"></div>
                  <p className="text-orange-700 text-lg font-medium tracking-wider bg-orange-50/50 px-4 py-1 rounded-full border border-amber-400/30">
                    BUSINESS COMMUNICATION REIMAGINED
                  </p>
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50"></div>
                </div>
              </div>
            </div>
            
            {/* Additional Glow Effects */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-32 bg-amber-400/10 blur-3xl rounded-full animate-glow-pulse"></div>
          </div>

          {/* Rotating Tagline */}
          <div className="max-w-3xl mx-auto relative z-10">
            <div className="h-20 flex items-center justify-center">
              {taglines.map((tagline, index) => (
                <p 
                  key={index}
                  className={`text-2xl md:text-3xl font-light text-orange-800 absolute transition-all duration-1000 ${
                    index === currentTagline 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-4'
                  }`}
                >
                  {tagline}
                </p>
              ))}
            </div>
            
            {/* Tagline Indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {taglines.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTagline(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentTagline 
                      ? 'bg-amber-500 w-6 shadow-lg shadow-amber-500/50' 
                      : 'bg-orange-300 hover:bg-orange-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="grid grid-cols-4 gap-4 mb-12 max-w-md mx-auto animate-fade-in-up delay-200">
          {Object.entries(timeLeft).map(([unit, value]) => (
            <div key={unit} className="text-center">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-300/50 shadow-lg hover:bg-white transition-all duration-300 hover:scale-105 group hover:border-amber-400/70">
                <div className="text-2xl md:text-3xl font-mono font-bold mb-1 bg-gradient-to-b from-orange-700 to-amber-600 bg-clip-text text-transparent group-hover:from-orange-800 group-hover:to-amber-700 transition-all duration-300">
                  {value.toString().padStart(2, '0')}
                </div>
                <div className="text-xs uppercase tracking-widest text-orange-600/80 group-hover:text-amber-600 transition-colors duration-300">
                  {unit}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notification Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-orange-300/50 shadow-2xl mb-8 animate-fade-in-up delay-300 hover:border-amber-400/60 transition-all duration-500">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">
            Get Exclusive <span className="text-amber-600">TrueTalk</span> Access
          </h2>
          <p className="text-orange-700 mb-6">
            Join {subscribedCount.toLocaleString()}+ forward-thinking businesses
          </p>

          {isSubmitted ? (
            <div className="text-center py-6 animate-success-bounce">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Welcome to <span className="text-amber-600">TrueTalk</span>!</h3>
              <p className="text-orange-700">
                You're now on the exclusive waitlist. We'll contact you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your business email"
                  className="flex-1 px-4 py-3 rounded-xl bg-white border border-orange-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder-orange-400 transition-all duration-300 focus:scale-105 focus:shadow-lg focus:shadow-amber-500/20"
                  required
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:from-orange-400 hover:to-amber-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-amber-400/50 hover:shadow-amber-500/25 hover:border-amber-300/70"
                >
                  Join TrueTalk
                </button>
              </div>
              <p className="text-sm text-orange-600">
                Early access includes premium features and dedicated support
              </p>
            </form>
          )}
        </div>

        {/* TrueTalk Value Proposition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in-up delay-400">
          {[
            { icon: "🚀", title: "TrueTalk Speed", desc: "Lightning-fast enterprise messaging" },
            { icon: "🔒", title: "TrueTalk Security", desc: "Military-grade encryption & compliance" },
            { icon: "💼", title: "TrueTalk Business", desc: "Built for modern enterprises" }
          ].map((item, index) => (
            <div key={index} className="bg-white/80 rounded-xl p-6 border border-orange-200 hover:border-amber-400/60 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
              <p className="text-orange-700 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Trust Bar */}
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-orange-700 animate-fade-in-up delay-500">
          {[
            "Enterprise Security",
            "SOC 2 Compliant", 
            "GDPR Ready",
            "End-to-End Encryption"
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-2 bg-white/80 px-4 py-2 rounded-full border border-orange-200 hover:border-amber-400/60 transition-all duration-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center animate-fade-in-up delay-600">
          <div className="bg-gradient-to-r from-transparent via-amber-400/40 to-transparent h-px w-full max-w-md mx-auto mb-6"></div>
          <p className="text-amber-600 font-semibold text-lg mb-2">TrueTalk Enterprise</p>
          <p className="text-orange-700 text-sm">
            Redefining business communication • Coming 2024
          </p>
          <p className="text-orange-500/70 text-xs mt-2">
            &copy; 2024 TrueTalk. Secure messaging for the modern workplace.
          </p>
        </div>
      </div>

      <style jsx>{`
        /* Connection Lines Animation */
        @keyframes connection-line {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        /* Business Card Animations */
        @keyframes business-card-1 {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          25% { transform: translate(20px, -15px) rotate(5deg); }
          50% { transform: translate(10px, 20px) rotate(-3deg); }
          75% { transform: translate(-15px, 10px) rotate(2deg); }
        }

        @keyframes business-card-2 {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          33% { transform: translate(-25px, 15px) rotate(-5deg); }
          66% { transform: translate(20px, -10px) rotate(3deg); }
        }

        /* Data Flow Animation */
        @keyframes data-flow {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.3;
          }
          25% { 
            transform: translateY(-40px) translateX(20px) scale(1.2);
            opacity: 0.8;
          }
          50% { 
            transform: translateY(-20px) translateX(40px) scale(1.5);
            opacity: 1;
          }
          75% { 
            transform: translateY(-60px) translateX(10px) scale(1.3);
            opacity: 0.6;
          }
        }

        /* Node Pulse Animations */
        @keyframes node-pulse-1 {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.8); opacity: 1; }
        }

        @keyframes node-pulse-2 {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(2); opacity: 1; }
        }

        /* Logo Glow Animation */
        @keyframes logo-glow {
          0%, 100% { 
            box-shadow: 
              0 0 40px rgba(251, 146, 60, 0.4),
              0 0 60px rgba(245, 158, 11, 0.3),
              inset 0 0 30px rgba(245, 158, 11, 0.3);
          }
          50% { 
            box-shadow: 
              0 0 60px rgba(251, 146, 60, 0.6),
              0 0 80px rgba(245, 158, 11, 0.5),
              inset 0 0 40px rgba(245, 158, 11, 0.5);
          }
        }

        /* Text Glow Animation */
        @keyframes text-glow {
          0%, 100% { 
            filter: 
              drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))
              drop-shadow(0 0 20px rgba(251, 146, 60, 0.4))
              drop-shadow(0 0 30px rgba(194, 65, 12, 0.3));
          }
          50% { 
            filter: 
              drop-shadow(0 0 15px rgba(245, 158, 11, 0.8))
              drop-shadow(0 0 30px rgba(251, 146, 60, 0.6))
              drop-shadow(0 0 45px rgba(194, 65, 12, 0.4));
          }
        }

        /* Keep other animations the same but update colors */
        .animate-connection-line { animation: connection-line linear infinite; }
        .animate-business-card-1 { animation: business-card-1 20s ease-in-out infinite; }
        .animate-business-card-2 { animation: business-card-2 25s ease-in-out infinite; }
        .animate-business-card-3 { animation: business-card-1 22s ease-in-out infinite; }
        .animate-business-card-4 { animation: business-card-2 18s ease-in-out infinite; }
        .animate-data-flow { animation: data-flow ease-in-out infinite; }
        .animate-node-pulse-1 { animation: node-pulse-1 3s ease-in-out infinite; }
        .animate-node-pulse-2 { animation: node-pulse-2 4s ease-in-out infinite 1s; }
        .animate-node-pulse-3 { animation: node-pulse-1 3.5s ease-in-out infinite 2s; }
        .animate-node-pulse-4 { animation: node-pulse-2 4.2s ease-in-out infinite 1.5s; }
        .animate-circuit-float-1 { animation: business-card-1 15s ease-in-out infinite; }
        .animate-circuit-float-2 { animation: business-card-2 17s ease-in-out infinite; }
        .animate-message-float-1 { animation: node-pulse-1 8s ease-in-out infinite; }
        .animate-message-float-2 { animation: node-pulse-2 10s ease-in-out infinite 2s; }
        .animate-message-float-3 { animation: node-pulse-1 9s ease-in-out infinite 1s; }
        .animate-shield-float-1 { animation: business-card-1 12s ease-in-out infinite; }
        .animate-shield-float-2 { animation: business-card-2 14s ease-in-out infinite 3s; }
        .animate-orb-float-1 { animation: business-card-1 30s ease-in-out infinite; }
        .animate-orb-float-2 { animation: business-card-2 35s ease-in-out infinite; }
        .animate-orb-float-3 { animation: business-card-1 40s ease-in-out infinite; }
        .animate-grid-flow { animation: connection-line 60s linear infinite; }
        .animate-logo-glow { animation: logo-glow 3s ease-in-out infinite; }
        .animate-text-glow { animation: text-glow 2s ease-in-out infinite; }
        .animate-glow-pulse { 
          animation: node-pulse-1 4s ease-in-out infinite; 
        }
        .animate-fade-in-up { 
          animation: fade-in-up 1s ease-out forwards; 
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-success-bounce { 
          animation: success-bounce 0.8s ease-out forwards; 
        }
        @keyframes success-bounce {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }

        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-600 { animation-delay: 600ms; }
      `}</style>
    </div>
  );
};

export default TrueTalkComingSoon;