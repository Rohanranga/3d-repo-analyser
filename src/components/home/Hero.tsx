'use client';

import { motion, useScroll, useTransform, useSpring, useMotionValue, useAnimationControls } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { RepoInput } from '@/components/input/RepoInput';
import { SplineScene } from '@/components/ui/splite';
import { Brain, GitBranch, Shield, Zap } from 'lucide-react';

interface HeroProps {
  onAnalyze: (type: 'url' | 'file', value: string) => void;
  isLoading: boolean;
}

const features = [
  {
    icon: Brain,
    title: 'Deep Analysis',
    desc: 'AI-powered breakdown of logic, flow, and architecture.',
    accent: 'blue',
    border: 'hover:border-blue-500/40',
    glow: 'hover:shadow-blue-500/20',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    gradient: 'from-blue-500/10 via-transparent to-transparent',
  },
  {
    icon: GitBranch,
    title: 'Visual Architecture',
    desc: 'Auto-generated interactive diagrams from your codebase.',
    accent: 'purple',
    border: 'hover:border-purple-500/40',
    glow: 'hover:shadow-purple-500/20',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    gradient: 'from-purple-500/10 via-transparent to-transparent',
  },
  {
    icon: Shield,
    title: 'Security & Quality',
    desc: 'Detect bugs, vulnerabilities, and code smells instantly.',
    accent: 'rose',
    border: 'hover:border-rose-500/40',
    glow: 'hover:shadow-rose-500/20',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    gradient: 'from-rose-500/10 via-transparent to-transparent',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    desc: 'Get actionable insights in seconds, not hours.',
    accent: 'amber',
    border: 'hover:border-amber-500/40',
    glow: 'hover:shadow-amber-500/20',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    gradient: 'from-amber-500/10 via-transparent to-transparent',
  },
];

const EMOJIS = ['🤖', '⚡', '🔥', '💥', '✨', '🎯', '🧠', '🚀'];

function FloatingParticle({ x, y, emoji, onDone }: { x: number; y: number; emoji: string; onDone: () => void }) {
  return (
    <motion.div
      className="fixed pointer-events-none z-[9999] text-xl select-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 1, scale: 0.4, y: 0, rotate: 0 }}
      animate={{ opacity: 0, scale: 1.6, y: -100, rotate: 270 }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      {emoji}
    </motion.div>
  );
}

// Animated grid background
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial fade over grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,transparent,#000_70%)]" />
    </div>
  );
}

export function Hero({ onAnalyze, isLoading }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const robotRef = useRef<HTMLDivElement>(null);

  // Scroll-driven robot parallax
  const { scrollY } = useScroll();
  const robotY = useTransform(scrollY, [0, 800], [0, 260]);
  const robotYSpring = useSpring(robotY, { stiffness: 60, damping: 20 });
  const robotScale = useTransform(scrollY, [0, 600], [1, 0.85]);
  const robotOpacity = useTransform(scrollY, [0, 700], [1, 0.35]);

  // Mouse tilt for robot (3D effect)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const tiltX = useSpring(useTransform(mouseY, [-300, 300], [6, -6]), { stiffness: 80, damping: 25 });
  const tiltY = useSpring(useTransform(mouseX, [-300, 300], [-6, 6]), { stiffness: 80, damping: 25 });

  // Animation controls
  const glitchControls = useAnimationControls();
  const badgeControls = useAnimationControls();

  // Particles
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const particleId = useRef(0);

  const spawnParticle = useCallback((x: number, y: number) => {
    const id = particleId.current++;
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    setParticles((p) => [...p, { id, x, y, emoji }]);
  }, []);

  const removeParticle = useCallback((id: number) => {
    setParticles((p) => p.filter((par) => par.id !== id));
  }, []);

  // Mouse tracking for robot tilt
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (robotRef.current) {
        const rect = robotRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - (rect.left + rect.width / 2));
        mouseY.set(e.clientY - (rect.top + rect.height / 2));
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [mouseX, mouseY]);

  // Periodic headline glitch — use 'tween' not 'spring' so multi-keyframes work
  useEffect(() => {
    const interval = setInterval(() => {
      glitchControls.start({
        x: [0, -4, 4, -2, 2, 0],
        skewX: [0, -2, 2, -1, 0],
        transition: { duration: 0.45, ease: 'easeInOut' },
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [glitchControls]);

  // Periodic badge wobble
  useEffect(() => {
    const interval = setInterval(() => {
      badgeControls.start({
        rotate: [0, -8, 8, -4, 4, 0],
        scale: [1, 1.1, 0.95, 1.05, 1],
        transition: { duration: 0.6, ease: 'easeInOut' },
      });
    }, 7000);
    return () => clearInterval(interval);
  }, [badgeControls]);

  const handleHeroClick = (e: React.MouseEvent) => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        spawnParticle(
          e.clientX + (Math.random() - 0.5) * 50,
          e.clientY + (Math.random() - 0.5) * 50
        );
      }, i * 90);
    }
  };

  return (
    <div className="bg-black" ref={heroRef} onClick={handleHeroClick}>

      {/* Particles */}
      {particles.map((p) => (
        <FloatingParticle key={p.id} x={p.x} y={p.y} emoji={p.emoji} onDone={() => removeParticle(p.id)} />
      ))}

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex flex-col lg:flex-row overflow-hidden">
        <GridBackground />

        {/* Ambient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/6 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-purple-600/6 rounded-full blur-[100px] pointer-events-none" />

        {/* LEFT — text + input */}
        <div className="relative z-10 flex flex-col justify-center w-full lg:w-1/2 px-5 sm:px-10 md:px-14 lg:px-16 xl:px-24 pt-24 sm:pt-28 pb-12 lg:pt-0 lg:pb-0">

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Badge */}
            <motion.div
              animate={badgeControls}
              whileHover={{ scale: 1.06, transition: { duration: 0.2 } }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                spawnParticle(e.clientX, e.clientY);
                badgeControls.start({
                  rotate: [0, -12, 12, -6, 6, 0],
                  scale: [1, 1.2, 0.9, 1.1, 1],
                  transition: { duration: 0.5, ease: 'easeInOut' },
                });
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs sm:text-sm font-medium text-white/60 tracking-wide">
                AI-Powered Code Analysis
              </span>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-medium">New</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              animate={glitchControls}
              className="text-3xl sm:text-5xl md:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.08] mb-5 cursor-default"
              onHoverStart={() => {
                glitchControls.start({
                  x: [0, -3, 3, 0],
                  skewX: [0, -1, 1, 0],
                  transition: { duration: 0.3, ease: 'easeInOut' },
                });
              }}
            >
              <span className="text-white">Understand any</span>
              <br />
              <span
                className="inline-block"
                style={{
                  background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 40%, #c084fc 70%, #e879f9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                codebase
              </span>
              <span className="text-white"> in</span>
              <br />
              <span className="text-white/50">seconds.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-sm sm:text-lg text-white/40 max-w-full sm:max-w-md mb-8 leading-relaxed"
              whileHover={{ color: 'rgba(255,255,255,0.6)', x: 2, transition: { duration: 0.2 } }}
            >
              CodeSonar uses advanced AI to analyze repositories, visualize
              architecture, detect bugs, and explain complex logic — instantly.
            </motion.p>
          </motion.div>

          {/* Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl"
          >
            <RepoInput onAnalyze={onAnalyze} isLoading={isLoading} />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-8 flex flex-wrap gap-6 sm:gap-8"
          >
            {[
              { val: '100+', label: 'Languages' },
              { val: 'AI', label: 'Powered' },
              { val: '<60s', label: 'Analysis Time' },
            ].map((s) => (
              <motion.div
                key={s.label}
                className="flex flex-col cursor-default"
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                onClick={(e) => { e.stopPropagation(); spawnParticle(e.clientX, e.clientY); }}
              >
                <span className="text-white font-bold text-xl leading-none">{s.val}</span>
                <span className="text-white/35 text-xs mt-1 tracking-wider uppercase">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — Spline robot (hidden on mobile) */}
        <motion.div
          ref={robotRef}
          className="hidden lg:block relative w-full lg:w-1/2 h-[55vw] sm:h-[50vw] lg:h-auto lg:min-h-screen flex-shrink-0"
          style={{
            y: robotYSpring,
            scale: robotScale,
            opacity: robotOpacity,
            rotateX: tiltX,
            rotateY: tiltY,
            transformStyle: 'preserve-3d',
            perspective: 1200,
          }}
        >
          {/* Ambient light layers */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_60%_40%,rgba(255,255,255,0.04),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_75%_50%,rgba(96,165,250,0.08),transparent)]" />
          </div>

          {/* Left blend */}
          <div className="absolute inset-y-0 left-0 w-40 z-20 pointer-events-none bg-gradient-to-r from-black to-transparent" />
          {/* Bottom blend */}
          <div className="absolute bottom-0 left-0 right-0 h-24 z-20 pointer-events-none bg-gradient-to-t from-black to-transparent" />

          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </motion.div>
      </section>

      {/* ── FEATURE CARDS ── */}
      <section className="relative z-10 bg-black py-20 sm:py-28 overflow-hidden">
        {/* Top separator line with glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Background ambient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(96,165,250,0.04),transparent)] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-400/70 mb-4">
              Capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
              Everything you need to{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #60a5fa, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                understand code
              </span>
            </h2>
            <p className="text-white/40 max-w-lg mx-auto text-sm sm:text-base">
              One tool. Complete visibility into any repository.
            </p>
          </motion.div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
                whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                onClick={(e) => {
                  e.stopPropagation();
                  for (let j = 0; j < 4; j++) {
                    setTimeout(() => spawnParticle(
                      e.clientX + (Math.random() - 0.5) * 60,
                      e.clientY + (Math.random() - 0.5) * 60
                    ), j * 70);
                  }
                }}
                className={`group relative flex flex-col gap-4 p-6 rounded-2xl cursor-pointer border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden transition-all duration-300 ${f.border} ${f.glow} hover:shadow-xl hover:bg-white/[0.04]`}
              >
                {/* Card inner gradient top-left */}
                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br ${f.gradient} opacity-60 pointer-events-none`} />

                {/* Icon */}
                <motion.div
                  className={`relative w-11 h-11 rounded-xl flex items-center justify-center ${f.iconBg}`}
                  whileHover={{ rotate: 15, scale: 1.1, transition: { duration: 0.25 } }}
                >
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </motion.div>

                {/* Text */}
                <div className="relative">
                  <p className="text-sm font-semibold text-white mb-1.5">{f.title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
                </div>

                {/* Hover shimmer line at bottom */}
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent ${f.iconColor} opacity-0`}
                  style={{ originX: 0.5 }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileHover={{ scaleX: 1, opacity: 0.5, transition: { duration: 0.3 } }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
