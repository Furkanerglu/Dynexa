"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LoadingScreenProps {
  progress: number;
  isLoaded: boolean;
}

export function LoadingScreen({ progress, isLoaded }: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {!isLoaded && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020202]"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-8"
          >
            {/* Logo */}
            <div className="text-4xl font-bold tracking-tighter">
              <span className="text-white">DYN</span>
              <span className="text-[#FF6B35]">EXA</span>
            </div>

            {/* Progress bar container */}
            <div className="w-64 h-[2px] bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#00D4AA] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {/* Yüzde */}
            <div className="text-white/40 text-sm font-mono">
              {progress}%
            </div>

            <div className="text-white/20 text-xs tracking-widest uppercase">
              Yükleniyor...
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
