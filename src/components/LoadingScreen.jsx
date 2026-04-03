import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <motion.div
        className="glass rounded-2xl px-8 py-6 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="gradient-text text-2xl font-semibold">SettleFlow</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Preparing your fintech workspace...</p>
      </motion.div>
    </div>
  );
}