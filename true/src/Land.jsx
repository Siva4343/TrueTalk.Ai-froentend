import { AnimatePresence, motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 300], [0, -50]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0.8]);
    
    // Refs for scroll animations
    const featuresRef = useRef(null);
    const aiRef = useRef(null);
    const meetingsRef = useRef(null);
    const jobsRef = useRef(null);
    const isFeaturesInView = useInView(featuresRef, { once: true, threshold: 0.1 });
    const isAiInView = useInView(aiRef, { once: true, threshold: 0.1 });
    const isMeetingsInView = useInView(meetingsRef, { once: true, threshold: 0.1 });
    const isJobsInView = useInView(jobsRef, { once: true, threshold: 0.1 });

    // Enhanced features data with more details
    const features = [
        {
            title: "HD Meetings",
            description: "Enterprise-grade video conferencing with 4K support, advanced screen sharing, and real-time collaboration tools designed for global teams.",
            image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            details: ["4K Ultra HD Video", "Advanced Screen Sharing", "Cloud Recording", "Virtual Backgrounds", "Breakout Rooms", "Enterprise Security"],
            icon: "🎥",
            stats: "98% customer satisfaction rate"
        },
        {
            title: "AI Integration",
            description: "Transform your workflow with intelligent AI features including smart automation, predictive analytics, and intelligent conversation insights.",
            image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            details: ["Smart Automation", "Predictive Analytics", "Auto Summaries", "Workflow Optimization", "Sentiment Analysis", "Custom AI Models"],
            icon: "🤖",
            stats: "40% increase in productivity"
        },
        {
            title: "AI Voice Assistant",
            description: "Revolutionary voice technology with real-time translation, intelligent responses, and hands-free operation for global business communication.",
            image: "https://images.unsplash.com/photo-1589254065878-42c9da997008?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            details: ["Voice Commands", "Real-time Translation", "Hands-free Operation", "Multi-language Support", "Voice Biometrics", "Context Awareness"],
            icon: "🎤",
            stats: "50+ languages supported"
        },
        {
            title: "Near Jobs",
            description: "Comprehensive talent platform connecting businesses with local professionals through intelligent matching and networking tools.",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            details: ["Local Job Matching", "Professional Networking", "Skill-based Matching", "Instant Applications", "Career Analytics", "Talent Pool Access"],
            icon: "💼",
            stats: "10K+ successful hires"
        }
    ];

    // Enhanced animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 60 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    const slideInLeft = {
        hidden: { opacity: 0, x: -100 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    const slideInRight = {
        hidden: { opacity: 0, x: 100 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    const scaleUp = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">
            {/* Enhanced Navigation */}
            <motion.nav
                className="fixed top-0 w-full bg-white/95 backdrop-blur-lg shadow-sm z-50 border-b border-gray-200"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <motion.div
                        className="flex items-center space-x-3"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">T</span>
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            TrueTalk
                        </h1>
                    </motion.div>
                    
                    <div className="hidden md:flex space-x-8">
                        {["Features", "AI & Voice", "HD Meetings", "Jobs", "Enterprise"].map((item, index) => (
                            <motion.a
                                key={item}
                                href={`#${item.toLowerCase().replace(' & ', '').replace(' ', '')}`}
                                className="text-gray-700 hover:text-blue-600 transition-colors relative font-medium text-sm uppercase tracking-wide"
                                whileHover={{ y: -2 }}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 + 0.3 }}
                            >
                                {item}
                                <motion.span
                                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"
                                    whileHover={{ width: "100%" }}
                                    transition={{ duration: 0.3 }}
                                />
                            </motion.a>
                        ))}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/login"
                            className="text-gray-700 hover:text-blue-600 font-medium text-sm"
                        >
                            <motion.div whileHover={{ scale: 1.05 }}>
                                Log In
                            </motion.div>
                        </Link>
                        <motion.button
                            as={Link}
                            to="/signup"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg transition-all duration-300 font-medium shadow-lg"
                            whileHover={{ 
                                scale: 1.05, 
                                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
                                y: -2
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Get Started Free
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* Enhanced Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
                <motion.div
                    style={{ y, opacity }}
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10"
                />
                
                <div className="relative z-10 text-center px-6 max-w-6xl">
                    <motion.div
                        className="inline-block mb-6 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium border border-gray-200 shadow-sm"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        🚀 Trusted by 10,000+ companies worldwide
                    </motion.div>
                    
                    <motion.h1
                        className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 mb-6 leading-tight"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, type: "spring", stiffness: 100 }}
                    >
                        <span className="block">TrueTalk:</span>
                        <motion.span
                            className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent inline-block"
                            animate={{
                                scale: [1, 1.02, 1],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        >
                            Connect Smarter
                        </motion.span>
                    </motion.h1>
                    
                    <motion.p
                        className="text-xl md:text-2xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                    >
                        Revolutionize your business communications with AI-powered collaboration, 
                        crystal-clear HD meetings, and intelligent networking solutions for the modern enterprise.
                    </motion.p>
                    
                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <motion.button
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl transition-all duration-300 relative overflow-hidden group"
                            whileHover={{ 
                                scale: 1.05, 
                                boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.6)" 
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <motion.span
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                            />
                            Start Free Trial
                        </motion.button>
                        
                        <motion.button
                            className="border-2 border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 bg-white/80 backdrop-blur-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="flex items-center space-x-2">
                                <span>Watch Demo</span>
                                <motion.span
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    →
                                </motion.span>
                            </div>
                        </motion.button>
                    </motion.div>
                    
                    <motion.div
                        className="flex items-center justify-center space-x-8 text-gray-600 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        {["No credit card required", "Free 14-day trial", "Setup in 5 minutes"].map((item, index) => (
                            <motion.div
                                key={item}
                                className="flex items-center space-x-2"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.4 + index * 0.1 }}
                            >
                                <motion.div
                                    className="w-2 h-2 bg-green-500 rounded-full"
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                                />
                                <span>{item}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Enhanced Background Elements */}
                <motion.img
                    src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                    alt="AI Collaboration"
                    className="absolute bottom-0 right-0 w-1/2 h-2/3 object-cover opacity-10 md:opacity-20"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 0.2, x: 0 }}
                    transition={{ delay: 1, duration: 1 }}
                />

                {/* Enhanced Floating Elements */}
                {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                        key={i}
                        className={`absolute ${i % 2 === 0 ? 'bg-blue-400' : 'bg-purple-400'} rounded-full`}
                        style={{
                            width: Math.random() * 20 + 10,
                            height: Math.random() * 20 + 10,
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            x: [0, Math.random() * 20 - 10, 0],
                            opacity: [0.3, 0.8, 0.3],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{
                            duration: Math.random() * 3 + 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 2
                        }}
                    />
                ))}
            </section>

            {/* Enhanced Stats Section */}
            <section className="py-20 bg-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-50"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        className="grid grid-cols-2 lg:grid-cols-4 gap-8"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        {[
                            { number: "10M+", label: "Active Users", description: "across 150+ countries", color: "from-blue-500 to-blue-600" },
                            { number: "50K+", label: "Businesses", description: "trust our platform", color: "from-purple-500 to-purple-600" },
                            { number: "99.9%", label: "Uptime SLA", description: "enterprise reliability", color: "from-green-500 to-green-600" },
                            { number: "4.8/5", label: "Rating", description: "based on 25K+ reviews", color: "from-orange-500 to-orange-600" }
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 group"
                                variants={itemVariants}
                                whileHover={{ 
                                    y: -8,
                                    transition: { type: "spring", stiffness: 300 }
                                }}
                            >
                                <motion.div
                                    className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ delay: index * 0.2, type: "spring", stiffness: 200 }}
                                >
                                    {stat.number}
                                </motion.div>
                                <div className="text-lg font-semibold text-gray-900 mb-1">{stat.label}</div>
                                <div className="text-sm text-gray-500">{stat.description}</div>
                                <motion.div
                                    className="w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 mt-4 group-hover:w-full transition-all duration-500"
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Enhanced Features Section */}
            <section id="features" ref={featuresRef} className="py-20 px-6 bg-gray-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <motion.div
                            className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-4"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            ✨ Enterprise Features
                        </motion.div>
                        <motion.h2
                            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            Everything You Need for <span className="text-blue-600">Modern Communication</span>
                        </motion.h2>
                        <motion.p
                            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            Experience the future of business communication with our comprehensive suite of tools 
                            designed for enterprises, remote teams, and forward-thinking professionals.
                        </motion.p>
                    </motion.div>

                    {/* Enhanced Feature Carousel */}
                    <div className="mb-20">
                        <motion.div
                            className="flex space-x-4 mb-8 overflow-x-auto pb-4 scrollbar-hide"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            {features.map((feature, index) => (
                                <motion.button
                                    key={feature.title}
                                    className={`px-8 py-4 rounded-xl font-semibold whitespace-nowrap transition-all duration-300 flex items-center space-x-3 ${
                                        activeFeature === index
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md hover:shadow-lg'
                                    }`}
                                    onClick={() => setActiveFeature(index)}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span className="text-lg">{feature.icon}</span>
                                    <span>{feature.title}</span>
                                </motion.button>
                            ))}
                        </motion.div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeFeature}
                                className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
                                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                                transition={{ duration: 0.5, type: "spring" }}
                            >
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
                                    <div className="p-12">
                                        <motion.div
                                            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full text-sm font-medium mb-6"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            <span className="text-blue-600">{features[activeFeature].stats}</span>
                                        </motion.div>
                                        <motion.h3
                                            className="text-4xl font-bold text-gray-900 mb-6"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            {features[activeFeature].title}
                                        </motion.h3>
                                        <motion.p
                                            className="text-lg text-gray-600 mb-8 leading-relaxed"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            {features[activeFeature].description}
                                        </motion.p>
                                        <motion.ul className="space-y-4 mb-8" variants={containerVariants}>
                                            {features[activeFeature].details.map((detail, idx) => (
                                                <motion.li
                                                    key={detail}
                                                    className="flex items-center text-gray-700 text-lg group"
                                                    variants={fadeInUp}
                                                    initial="hidden"
                                                    animate="visible"
                                                    transition={{ delay: idx * 0.1 }}
                                                >
                                                    <motion.div
                                                        className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                                                        whileHover={{ rotate: 360 }}
                                                        transition={{ duration: 0.6 }}
                                                    >
                                                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </motion.div>
                                                    {detail}
                                                </motion.li>
                                            ))}
                                        </motion.ul>
                                        <motion.button
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.8 }}
                                        >
                                            Explore Feature
                                        </motion.button>
                                    </div>
                                    <motion.div
                                        className="relative h-96 xl:h-auto bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <motion.img
                                            src={features[activeFeature].image}
                                            alt={features[activeFeature].title}
                                            className="rounded-2xl shadow-2xl w-full h-full object-cover"
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        />
                                        <motion.div
                                            className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-4"
                                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                            transition={{ delay: 1, type: "spring" }}
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                        >
                                            <div className="text-2xl">{features[activeFeature].icon}</div>
                                        </motion.div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Enhanced All Features Grid */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 group cursor-pointer"
                                variants={itemVariants}
                                whileHover={{
                                    y: -12,
                                    scale: 1.02,
                                    transition: { type: "spring", stiffness: 300 }
                                }}
                                onClick={() => setActiveFeature(index)}
                            >
                                <motion.div
                                    className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg"
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <span className="text-white text-2xl">{feature.icon}</span>
                                </motion.div>
                                <motion.div
                                    className="w-full h-48 mb-6 rounded-xl overflow-hidden"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <img
                                        src={feature.image}
                                        alt={feature.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                                <div className="flex items-center text-sm text-blue-600 font-semibold group-hover:text-purple-600 transition-colors duration-300">
                                    Learn more
                                    <motion.svg
                                        className="w-4 h-4 ml-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        whileHover={{ x: 4 }}
                                        transition={{ type: "spring", stiffness: 400 }}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </motion.svg>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Enhanced AI & Voice Section */}
            <section id="ai" ref={aiRef} className="py-20 px-6 bg-gradient-to-br from-blue-600 to-purple-700 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            variants={slideInLeft}
                            initial="hidden"
                            animate={isAiInView ? "visible" : "hidden"}
                        >
                            <motion.div
                                className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6 backdrop-blur-sm"
                                variants={itemVariants}
                            >
                                <span>🤖</span>
                                <span>AI Powered Technology</span>
                            </motion.div>
                            <motion.h2
                                className="text-4xl md:text-5xl font-bold mb-6"
                                variants={itemVariants}
                            >
                                Intelligent Voice Assistant
                            </motion.h2>
                            <motion.p
                                className="text-xl text-blue-100 mb-8 leading-relaxed"
                                variants={itemVariants}
                            >
                                Our advanced AI voice assistant listens, understands, and responds intelligently, 
                                making your conversations more efficient and engaging than ever before.
                            </motion.p>
                            <motion.ul className="space-y-4 mb-8" variants={containerVariants}>
                                {[
                                    "Real-time voice translation in 50+ languages",
                                    "Smart meeting summaries and action items",
                                    "Voice-controlled meeting management",
                                    "Emotion-aware responses and sentiment analysis",
                                    "Automated workflow triggers",
                                    "Multi-modal conversation understanding"
                                ].map((item, index) => (
                                    <motion.li
                                        key={item}
                                        className="flex items-center text-blue-100"
                                        variants={itemVariants}
                                    >
                                        <motion.div
                                            className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-4 flex-shrink-0 backdrop-blur-sm"
                                            whileHover={{ scale: 1.2 }}
                                            transition={{ type: "spring", stiffness: 400 }}
                                        >
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </motion.div>
                                        {item}
                                    </motion.li>
                                ))}
                            </motion.ul>
                            <motion.div className="flex flex-col sm:flex-row gap-4" variants={itemVariants}>
                                <motion.button
                                    className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Try AI Assistant
                                </motion.button>
                                <motion.button
                                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    View Demo
                                </motion.button>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            className="relative"
                            variants={slideInRight}
                            initial="hidden"
                            animate={isAiInView ? "visible" : "hidden"}
                        >
                            <motion.div
                                className="relative rounded-3xl overflow-hidden shadow-2xl"
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                    alt="AI Voice Assistant"
                                    className="w-full h-auto"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent"></div>
                            </motion.div>
                            
                            {/* Enhanced Animated Elements */}
                            <motion.div
                                className="absolute -bottom-6 -right-6 w-24 h-24 bg-white rounded-2xl shadow-2xl flex items-center justify-center"
                                animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <div className="text-blue-600 text-2xl">🎤</div>
                            </motion.div>
                            
                            <motion.div
                                className="absolute -top-6 -left-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl p-4 shadow-2xl"
                                animate={{
                                    y: [0, -10, 0],
                                    opacity: [0.8, 1, 0.8]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 1
                                }}
                            >
                                <div className="text-white font-semibold text-sm">Live Translation</div>
                            </motion.div>

                            {/* Voice waves animation */}
                            <motion.div className="absolute bottom-4 left-4 flex space-x-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1 bg-white rounded-full"
                                        animate={{
                                            height: [5, 20, 5],
                                            opacity: [0.5, 1, 0.5]
                                        }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            delay: i * 0.1
                                        }}
                                        style={{ height: '5px' }}
                                    />
                                ))}
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Enhanced HD Meetings Section */}
            <section id="meetings" ref={meetingsRef} className="py-20 px-6 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        variants={scaleUp}
                        initial="hidden"
                        animate={isMeetingsInView ? "visible" : "hidden"}
                    >
                        <motion.div
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-600 rounded-full text-sm font-medium mb-4"
                            variants={itemVariants}
                        >
                            <span>🎥</span>
                            <span>HD Quality</span>
                        </motion.div>
                        <motion.h2
                            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
                            variants={itemVariants}
                        >
                            Professional Grade <span className="text-blue-600">Video Conferencing</span>
                        </motion.h2>
                        <motion.p
                            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                            variants={itemVariants}
                        >
                            Experience enterprise-level video conferencing with crystal-clear 4K quality, 
                            advanced collaboration tools, and military-grade security for your most important conversations.
                        </motion.p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            variants={slideInLeft}
                            initial="hidden"
                            animate={isMeetingsInView ? "visible" : "hidden"}
                            className="relative"
                        >
                            <motion.div
                                className="rounded-3xl overflow-hidden shadow-2xl"
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            ></motion.div>
                            <img
                                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                    alt="HD Meeting"
                                    className="w-full h-auto"
                                />
                            <motion.div
                                className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-2xl p-6"
                                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ delay: 0.6, type: "spring" }}
                                whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                                <div className="text-2xl font-bold text-blue-600">4K</div>
                                <div className="text-sm text-gray-600">Ultra HD</div>
                            </motion.div>
                            <motion.div
                                className="absolute -top-6 -right-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl p-4 text-white"
                                initial={{ opacity: 0, y: -50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, type: "spring" }}
                            >
                                <div className="text-sm font-semibold">Live</div>
                            <div className="text-xs">Recording</div>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            variants={slideInRight}
                            initial="hidden"
                            animate={isMeetingsInView ? "visible" : "hidden"}
                        >
                            <div className="space-y-8">
                                {[
                                    {
                                        title: "4K Ultra HD Video",
                                        description: "Crystal clear video quality with advanced noise cancellation and auto-framing technology",
                                        icon: "📹",
                                        color: "from-blue-500 to-blue-600"
                                    },
                                    {
                                        title: "Smart Screen Sharing",
                                        description: "Share your screen, specific applications, or collaborative whiteboards in real-time",
                                        icon: "🖥️",
                                        color: "from-purple-500 to-purple-600"
                                    },
                                    {
                                        title: "Cloud Recording & Playback",
                                        description: "Automatically record meetings with AI-powered highlights and searchable transcripts",
                                        icon: "⏺️",
                                        color: "from-green-500 to-green-600"
                                    },
                                    {
                                        title: "Virtual Backgrounds & Filters",
                                        description: "Professional virtual backgrounds and real-time video enhancement filters",
                                        icon: "🎭",
                                        color: "from-orange-500 to-orange-600"
                                    },
                                    {
                                        title: "Breakout Rooms",
                                        description: "Create separate discussion rooms and manage them effortlessly",
                                        icon: "🚪",
                                        color: "from-pink-500 to-pink-600"
                                    },
                                    {
                                        title: "Enterprise Security",
                                        description: "End-to-end encryption, waiting rooms, and advanced access controls",
                                        icon: "🔒",
                                        color: "from-red-500 to-red-600"
                                    }
                                ].map((feature, index) => (
                                    <motion.div
                                        key={feature.title}
                                        className="flex items-start space-x-6 p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300 group cursor-pointer"
                                        variants={itemVariants}
                                        whileHover={{ 
                                            x: 8,
                                            transition: { type: "spring", stiffness: 400 }
                                        }}
                                    >
                                        <motion.div
                                            className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                                            whileHover={{ rotate: 360 }}
                                            transition={{ duration: 0.6 }}
                                        >
                                            <span className="text-2xl text-white">{feature.icon}</span>
                                        </motion.div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                        </div>
                                        <motion.div
                                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            whileHover={{ x: 5 }}
                                        >
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </motion.div>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                className="flex flex-col sm:flex-row gap-4 mt-8"
                                variants={itemVariants}
                            >
                                <motion.button
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Start Meeting Now
                                </motion.button>
                                <motion.button
                                    className="border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Download Desktop App
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Enhanced Jobs Section */}
            <section id="jobs" ref={jobsRef} className="py-20 px-6 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        variants={scaleUp}
                        initial="hidden"
                        animate={isJobsInView ? "visible" : "hidden"}
                    >
                        <motion.div
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-4"
                            variants={itemVariants}
                        >
                            <span>💼</span>
                            <span>Career Opportunities</span>
                        </motion.div>
                        <motion.h2
                            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
                            variants={itemVariants}
                        >
                            Discover Your Next <span className="text-blue-600">Career Move</span>
                        </motion.h2>
                        <motion.p
                            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                            variants={itemVariants}
                        >
                            Connect with local opportunities and top talent. Whether you're hiring or looking for your next role, 
                            our intelligent platform makes career connections seamless and effective.
                        </motion.p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                        <motion.div
                            className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 group"
                            variants={slideInLeft}
                            initial="hidden"
                            animate={isJobsInView ? "visible" : "hidden"}
                            whileHover={{ y: -12 }}
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-4">Hire Top Talent</h3>
                            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                Reach qualified local talent instantly with our intelligent matching system and advanced candidate screening technology.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {[
                                    "AI-powered candidate matching",
                                    "Local talent targeting",
                                    "Instant notifications",
                                    "Streamlined application management",
                                    "Candidate analytics dashboard",
                                    "One-click interview scheduling"
                                ].map((item) => (
                                    <li key={item} className="flex items-center text-gray-700">
                                        <motion.div
                                            className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                                            whileHover={{ scale: 1.2 }}
                                        >
                                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </motion.div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <motion.button
                                onClick={() => setIsJobModalOpen(true)}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg group relative overflow-hidden"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="relative z-10">Post Job - Free Trial</span>
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                                />
                            </motion.button>
                        </motion.div>

                        <motion.div
                            className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 group"
                            variants={slideInRight}
                            initial="hidden"
                            animate={isJobsInView ? "visible" : "hidden"}
                            whileHover={{ y: -12 }}
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-4">Find Your Dream Job</h3>
                            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                Discover perfect opportunities near you with our location-based job matching and intelligent career recommendations.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {[
                                    "Personalized job recommendations",
                                    "One-click applications",
                                    "Real-time salary insights",
                                    "Company culture reviews",
                                    "Skill gap analysis",
                                    "Career path planning"
                                ].map((item) => (
                                    <li key={item} className="flex items-center text-gray-700">
                                        <motion.div
                                            className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                                            whileHover={{ scale: 1.2 }}
                                        >
                                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </motion.div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <motion.button
                                className="w-full bg-gradient-to-br from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg group relative overflow-hidden"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="relative z-10">Browse 10K+ Jobs</span>
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                                />
                            </motion.button>
                        </motion.div>
                    </div>

                    {/* Enhanced Testimonials */}
                    <motion.div
                        className="text-center"
                        variants={scaleUp}
                        initial="hidden"
                        animate={isJobsInView ? "visible" : "hidden"}
                    >
                        <h3 className="text-3xl font-bold text-gray-900 mb-12">Trusted by Professionals Worldwide</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    name: "Sarah Chen",
                                    role: "Product Manager at TechCorp",
                                    text: "Found my dream job through TrueTalk's intelligent matching! The platform connected me with perfect local opportunities I wouldn't have found otherwise.",
                                    avatar: "👩‍💼",
                                    company: "TechCorp"
                                },
                                {
                                    name: "Mike Rodriguez",
                                    role: "HR Director at InnovateInc",
                                    text: "The quality of candidates we get through TrueTalk is outstanding. We've reduced our hiring time by 60% while improving candidate quality.",
                                    avatar: "👨‍💼",
                                    company: "InnovateInc"
                                },
                                {
                                    name: "Emily Watson",
                                    role: "Senior Software Engineer",
                                    text: "Landing interviews has never been easier. The location-based matching and one-click applications made my job search incredibly efficient.",
                                    avatar: "👩‍🔬",
                                    company: "RemoteFirst"
                                }
                            ].map((testimonial, index) => (
                                <motion.div
                                    key={testimonial.name}
                                    className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group"
                                    variants={itemVariants}
                                    whileHover={{ y: -8 }}
                                >
                                    <div className="text-4xl mb-4">{testimonial.avatar}</div>
                                    <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
                                    <p className="text-gray-600 mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                                    <div className="text-gray-500 text-sm">{testimonial.role}</div>
                                    <div className="text-blue-600 text-xs font-medium mt-1">{testimonial.company}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Enhanced Newsletter Signup */}
            <section className="py-20 px-6 bg-gradient-to-br from-gray-900 to-blue-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-6 backdrop-blur-sm"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span>📰</span>
                        <span>Stay Informed</span>
                    </motion.div>
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold mb-6"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        Join the <span className="text-blue-400">TrueTalk</span> Community
                    </motion.h2>
                    <motion.p
                        className="text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl mx-auto"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Subscribe for exclusive updates, early feature access, expert tips, and special offers 
                        delivered directly to your inbox.
                    </motion.p>
                    <motion.div
                        className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4 max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <input
                            type="email"
                            placeholder="Enter your work email"
                            className="px-6 py-4 rounded-xl w-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg border-0"
                        />
                        <motion.button
                            className="bg-blue-500 hover:bg-blue-400 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg whitespace-nowrap w-full md:w-auto"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Subscribe Now
                        </motion.button>
                    </motion.div>
                    <motion.p
                        className="text-blue-300 mt-6 text-sm"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        🔒 No spam, unsubscribe at any time. We respect your privacy.
                    </motion.p>
                </div>
            </section>

            {/* Enhanced Footer */}
            <footer className="py-16 px-6 bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
                        <motion.div
                            className="lg:col-span-2"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                        >
                            <motion.div
                                className="flex items-center space-x-3 mb-6"
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">T</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white">TrueTalk</h3>
                            </motion.div>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                Revolutionizing business communication with AI-powered tools for modern enterprises. 
                                Join thousands of companies transforming how they connect and collaborate.
                            </p>
                            <div className="flex space-x-4">
                                {['Twitter', 'LinkedIn', 'GitHub', 'Facebook'].map((social) => (
                                    <motion.a
                                        key={social}
                                        href="#"
                                        className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-300"
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <span className="text-white font-semibold text-sm">{social[0]}</span>
                                    </motion.a>
                                ))}
                            </div>
                        </motion.div>

                        {[
                            {
                                title: "Product",
                                links: ["Features", "AI Assistant", "HD Meetings", "Job Network", "Enterprise", "Pricing", "Security"]
                            },
                            {
                                title: "Solutions",
                                links: ["Enterprise", "Startups", "Remote Teams", "Education", "Healthcare", "Government", "Non-profit"]
                            },
                            {
                                title: "Resources",
                                links: ["Documentation", "API", "Help Center", "Community", "Blog", "Webinars", "Tutorials"]
                            },
                            {
                                title: "Company",
                                links: ["About", "Careers", "Press", "Partners", "Contact", "Leadership", "Investors"]
                            }
                        ].map((section, index) => (
                            <motion.div
                                key={section.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <h4 className="font-semibold text-white mb-4 text-lg">{section.title}</h4>
                                <ul className="space-y-3">
                                    {section.links.map((link) => (
                                        <li key={link}>
                                            <motion.a
                                                href="#"
                                                className="text-gray-400 hover:text-white transition-colors duration-300 block py-1"
                                                whileHover={{ x: 4 }}
                                            >
                                                {link}
                                            </motion.a>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        className="border-t border-gray-800 pt-8 text-center text-gray-400"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                    >
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            <p>&copy; 2024 TrueTalk Technologies. All rights reserved.</p>
                            <div className="flex space-x-6">
                                {["Privacy Policy", "Terms of Service", "Security", "Cookies", "Accessibility"].map((item) => (
                                    <motion.a
                                        key={item}
                                        href="#"
                                        className="hover:text-white transition-colors duration-300"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        {item}
                                    </motion.a>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </footer>

            {/* Enhanced Job Modal */}
            <AnimatePresence>
                {isJobModalOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white p-8 rounded-3xl shadow-2xl max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-3xl font-bold text-gray-900">Post a New Job</h3>
                                    <p className="text-gray-600 mt-2">Reach thousands of qualified professionals in your area</p>
                                </div>
                                <motion.button
                                    onClick={() => setIsJobModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </div>

                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Senior Frontend Developer"
                                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                                        <input
                                            type="text"
                                            placeholder="Your company name"
                                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                                        <input
                                            type="text"
                                            placeholder="City, State or Remote"
                                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                                        <select className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300">
                                            <option>Full-time</option>
                                            <option>Part-time</option>
                                            <option>Contract</option>
                                            <option>Internship</option>
                                            <option>Remote</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
                                    <textarea
                                        placeholder="Describe the role, requirements, responsibilities, and benefits..."
                                        rows="6"
                                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., $80,000 - $120,000"
                                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Application Email</label>
                                        <input
                                            type="email"
                                            placeholder="careers@yourcompany.com"
                                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="relative z-10">Post Job - Free Preview</span>
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                                    />
                                </motion.button>
                                
                                <p className="text-center text-gray-500 text-sm">
                                    Your job will be live immediately. Upgrade to featured listing for better visibility.
                                </p>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingPage;

