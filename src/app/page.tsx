"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogIn, Users, FileText, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="max-w-4xl mx-auto px-4 z-10 text-center space-y-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="h-20 w-20 bg-blue-600 rounded-3xl mx-auto shadow-xl shadow-blue-500/30 flex items-center justify-center mb-8">
            <BrainCircuit className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 font-sans">
            AI Team Management <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              For Smart Students
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            Upload your assignments, instantly split tasks fairly using AI, and collaborate in real-time. Stop worrying about who does what.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <button
            onClick={loginWithGoogle}
            className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-slate-900 px-8 font-medium text-white transition-all duration-300 hover:scale-105 hover:bg-slate-800 shadow-lg shadow-slate-900/20"
          >
            <span className="mr-3">
              <LogIn className="h-5 w-5" />
            </span>
            <span className="text-lg">Get Started with Google</span>
            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
              <div className="relative h-full w-8 bg-white/20" />
            </div>
          </button>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mt-24 text-left">
          <FeatureCard 
            icon={<Users className="h-6 w-6 text-blue-600" />}
            title="Team Rooms"
            desc="Create or join real-time synced workspaces for your group assignments."
            delay={0.3}
          />
          <FeatureCard 
            icon={<FileText className="h-6 w-6 text-indigo-600" />}
            title="AI Task Split"
            desc="Upload PDF/Text assignments and let AI divide the workload fairly."
            delay={0.4}
          />
          <FeatureCard 
            icon={<BrainCircuit className="h-6 w-6 text-purple-600" />}
            title="Research Assistant"
            desc="Built-in smart researcher to fetch info and apply it to tasks."
            delay={0.5}
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1"
    >
      <div className="h-12 w-12 bg-slate-50 flex items-center justify-center rounded-xl mb-4 border border-slate-100">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{desc}</p>
    </motion.div>
  );
}
