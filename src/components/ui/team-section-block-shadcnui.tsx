"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const teamMembers = [
  {
    name: "Sarah Johnson",
    role: "CEO & Founder",
    bio: "Visionary leader with 15+ years in tech",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop",
    location: "San Francisco",
    skills: ["Strategy", "Leadership", "Innovation"],
    gradient: "from-white/10 via-white/5 to-transparent",
    social: {
      twitter: "#",
      linkedin: "#",
      github: "#",
      email: "sarah@example.com",
    },
  },
  {
    name: "Michael Chen",
    role: "CTO",
    bio: "Full-stack architect and AI enthusiast",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
    location: "New York",
    skills: ["AI/ML", "Architecture", "Cloud"],
    gradient: "from-white/12 via-white/5 to-transparent",
    social: {
      twitter: "#",
      linkedin: "#",
      github: "#",
      email: "michael@example.com",
    },
  },
  {
    name: "Emily Rodriguez",
    role: "Head of Design",
    bio: "Creative mind behind beautiful interfaces",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
    location: "London",
    skills: ["UI/UX", "Branding", "Motion"],
    gradient: "from-white/12 via-white/5 to-transparent",
    social: {
      twitter: "#",
      linkedin: "#",
      github: "#",
      email: "emily@example.com",
    },
  },
  {
    name: "David Park",
    role: "Lead Developer",
    bio: "Code wizard and performance optimizer",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
    location: "Tokyo",
    skills: ["React", "TypeScript", "Performance"],
    gradient: "from-foreground/12 via-foreground/5 to-transparent",
    social: {
      twitter: "#",
      linkedin: "#",
      github: "#",
      email: "david@example.com",
    },
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.6, 0.05, 0.01, 0.9],
    },
  },
};

function SocialIcon({ label }: { label: string }) {
  if (label === "Twitter") {
    return (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z" />
      </svg>
    );
  }
  if (label === "LinkedIn") {
    return (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    );
  }
  if (label === "GitHub") {
    return (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    );
  }
  return <Mail className="h-4 w-4" aria-hidden />;
}

function TeamMemberCard({ member }: { member: (typeof teamMembers)[0] }) {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = (e.clientX - rect.left - width / 2) / (width / 2);
    const y = (e.clientY - rect.top - height / 2) / (height / 2);
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div variants={itemVariants} className="perspective-1000">
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="group relative"
      >
        <Card className="relative overflow-hidden rounded-3xl border border-border/60 bg-card backdrop-blur-xl transition-shadow duration-500">
          {/* Animated gradient overlay */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${member.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
            animate={
              isHovered
                ? { opacity: 1 }
                : { opacity: shouldReduceMotion ? 0.05 : 0 }
            }
          />

          {/* Sparkle effect on hover */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={
              isHovered
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: shouldReduceMotion ? 1 : 0.6 }
            }
            className="absolute right-4 top-4 z-10"
          >
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          </motion.div>

          <div className="relative z-10 p-6">
            {/* Avatar Section */}
            <div className="mb-4 flex justify-center">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className="absolute -inset-2 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0))`,
                  }}
                  animate={
                    isHovered
                      ? {
                          rotate: shouldReduceMotion ? 0 : 360,
                          scale: shouldReduceMotion ? 1 : [1, 1.08, 1],
                        }
                      : { rotate: 0, scale: 1 }
                  }
                  transition={{
                    duration: shouldReduceMotion ? 0.6 : 3,
                    repeat: shouldReduceMotion ? 0 : Infinity,
                    ease: "linear",
                  }}
                />
                <div className="relative h-28 w-28 overflow-hidden rounded-full border border-border/60 bg-card/80 p-1">
                  <motion.img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full rounded-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            </div>

            {/* Info Section */}
            <div className="text-center">
              <motion.h3
                className="mb-1 text-xl font-semibold tracking-tight text-white"
                animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {member.name}
              </motion.h3>
              <Badge
                variant="secondary"
                className="mb-2 bg-white/10 text-xs uppercase tracking-[0.28em] text-slate-400 backdrop-blur"
              >
                {member.role}
              </Badge>

              <motion.div
                className="mb-3 flex items-center justify-center gap-1 text-xs text-slate-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <MapPin className="h-3 w-3" aria-hidden />
                <span>{member.location}</span>
              </motion.div>

              <p className="mb-4 text-sm text-slate-400">
                {member.bio}
              </p>

              {/* Skills */}
              <motion.div
                className="mb-4 flex flex-wrap justify-center gap-1.5"
                initial={{ opacity: 0, y: 10 }}
                animate={
                  isHovered ? { opacity: 1, y: 0 } : { opacity: 0.7, y: 0 }
                }
                transition={{ duration: 0.3 }}
              >
                {member.skills.map((skill, idx) => (
                  <motion.div
                    key={skill}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 * idx, type: "spring" }}
                  >
                    <Badge
                      variant="outline"
                      className="border-border/60 bg-white/5 text-xs text-slate-300 transition-colors hover:bg-white/10"
                    >
                      {skill}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>

              {/* Social Links */}
              <motion.div
                className="flex justify-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {[
                  { label: "Twitter" },
                  { label: "LinkedIn" },
                  { label: "GitHub" },
                  { label: "Email" },
                ].map((social, idx) => (
                  <motion.div
                    key={social.label}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={
                      isHovered
                        ? { scale: 1, rotate: shouldReduceMotion ? 0 : 0 }
                        : { scale: 0.85, rotate: 0 }
                    }
                    transition={{
                      delay: isHovered ? 0.1 * idx : 0,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 rounded-full border border-border/40 bg-white/5 text-slate-400 transition-colors hover:text-white p-0"
                    >
                      <motion.div
                        transition={{
                          duration: shouldReduceMotion ? 0.25 : 0.4,
                        }}
                      >
                        <SocialIcon label={social.label} />
                      </motion.div>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function TeamSectionBlock() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="team-section-heading"
      className="relative w-full overflow-hidden px-4 py-20 sm:px-6 lg:px-10"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{
            scale: shouldReduceMotion ? 1 : [1, 1.18, 1],
            rotate: shouldReduceMotion ? 0 : [0, 90, 0],
            opacity: [0.12, 0.3, 0.12],
          }}
          transition={{
            duration: shouldReduceMotion ? 0.6 : 18,
            repeat: shouldReduceMotion ? 0 : Infinity,
            ease: "linear",
          }}
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/25 blur-[180px]"
        />
        <motion.div
          animate={{
            scale: shouldReduceMotion ? 1 : [1.1, 1, 1.1],
            rotate: shouldReduceMotion ? 0 : [0, -90, 0],
            opacity: [0.12, 0.32, 0.12],
          }}
          transition={{
            duration: shouldReduceMotion ? 0.6 : 16,
            repeat: shouldReduceMotion ? 0 : Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-[180px]"
        />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
          className="mb-16 text-center"
        >
          <motion.div className="mb-6 inline-block">
            <Badge
              className="gap-2 bg-white/10 text-slate-300 backdrop-blur"
              variant="secondary"
            >
              <Sparkles className="h-3 w-3" aria-hidden />
              Our Dream Team
            </Badge>
          </motion.div>

          <motion.h2
            id="team-section-heading"
            className="mb-6 bg-gradient-to-r from-white via-white/80 to-white/60 bg-clip-text text-5xl font-semibold tracking-tight text-transparent md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Meet the people behind
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              our success
            </span>
          </motion.h2>

          <motion.p
            className="mx-auto max-w-2xl text-lg text-slate-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            A diverse team of talented individuals working together to build
            amazing products and deliver exceptional results.
          </motion.p>
        </motion.div>

        {/* Team Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2"
        >
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={index} member={member} />
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <Card className="inline-flex flex-col items-center gap-6 rounded-3xl border border-border/60 bg-card/80 px-10 py-8 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.6)] backdrop-blur-xl">
            <h3 className="text-2xl font-semibold text-white">Join Our Amazing Team</h3>
            <p className="max-w-xl text-sm text-slate-400">
              We&apos;re always looking for talented people to join our mission
            </p>
            <Button
              size="lg"
              className="group relative overflow-hidden rounded-full bg-indigo-600 px-10 py-6 text-white shadow-lg shadow-indigo-500/25 transition-transform duration-300 hover:translate-y-[-2px]"
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                animate={
                  shouldReduceMotion ? undefined : { x: ["-120%", "120%"] }
                }
                transition={
                  shouldReduceMotion
                    ? undefined
                    : { repeat: Infinity, duration: 2, ease: "linear" }
                }
              />
              <span className="relative font-medium">View Open Positions</span>
              <motion.span
                className="relative ml-2"
                animate={shouldReduceMotion ? undefined : { x: [0, 5, 0] }}
                transition={
                  shouldReduceMotion
                    ? undefined
                    : { repeat: Infinity, duration: 1.5 }
                }
              >
                →
              </motion.span>
            </Button>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}