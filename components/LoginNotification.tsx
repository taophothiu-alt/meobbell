import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const LoginNotification: React.FC = () => {
    const { user, login } = useAuth();

    if (user) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest py-2 px-4 text-center cursor-pointer hover:bg-indigo-700 transition flex justify-center items-center gap-2 relative z-[300]"
                onClick={login}
            >
                <i className="fab fa-google"></i>
                <span>Đăng nhập để lưu tiến trình học tập</span>
            </motion.div>
        </AnimatePresence>
    );
};
