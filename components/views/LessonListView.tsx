
import React from 'react';
import { AppDatabase } from '../../types';
import { Block } from '../Block';
import { saveDB } from '../../services/storageService';

interface LessonListProps {
    db: AppDatabase;
    onSelect: (lessonId: string) => void;
    onUpdateDb: (newDb: AppDatabase) => void;
}

export const LessonListView: React.FC<LessonListProps> = ({ db, onSelect, onUpdateDb }) => {
    const hiddenSet = new Set(db.hiddenLessons || []);
    const currentLevel = db.config.level || 'N5';
    
    // Show ALL lessons for the current level, sorted
    const lessons = (Array.from(new Set(db.vocab
        .filter(v => !v.level || v.level === currentLevel)
        .map(v => v.lesson))) as string[])
        .sort((a, b) => parseInt(a) - parseInt(b));

    const [showHiddenManager, setShowHiddenManager] = React.useState(false);

    const toggleVisibility = (e: React.MouseEvent, lessonId: string) => {
        e.stopPropagation(); // Prevent selecting the lesson
        const newHidden = new Set(hiddenSet);
        if (newHidden.has(lessonId)) {
            newHidden.delete(lessonId);
        } else {
            newHidden.add(lessonId);
        }
        const newDb = { ...db, hiddenLessons: Array.from(newHidden) };
        saveDB(newDb);
        onUpdateDb(newDb);
    };

    // 15 Bright Neon Colors
    const NEON_COLORS = [
        'border-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.3)]', // Cyan
        'border-[#ff00ff] shadow-[0_0_15px_rgba(255,0,255,0.3)]', // Magenta
        'border-[#ccff00] shadow-[0_0_15px_rgba(204,255,0,0.3)]', // Lime
        'border-[#bc13fe] shadow-[0_0_15px_rgba(188,19,254,0.3)]', // Purple
        'border-[#ffaa00] shadow-[0_0_15px_rgba(255,170,0,0.3)]', // Amber
        'border-[#ff69b4] shadow-[0_0_15px_rgba(255,105,180,0.3)]', // Hot Pink
        'border-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.3)]', // Bright Teal
        'border-[#007fff] shadow-[0_0_15px_rgba(0,127,255,0.3)]', // Electric Blue
        'border-[#ff5f00] shadow-[0_0_15px_rgba(255,95,0,0.3)]', // Vivid Orange
        'border-[#bfff00] shadow-[0_0_15px_rgba(191,255,0,0.3)]', // Acid Green
        'border-[#ff0033] shadow-[0_0_15px_rgba(255,0,51,0.3)]', // Crimson Red
        'border-[#00bfff] shadow-[0_0_15px_rgba(0,191,255,0.3)]', // Deep Sky Blue
        'border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.3)]', // Gold
        'border-[#9400d3] shadow-[0_0_15px_rgba(148,0,211,0.3)]', // Bright Violet
        'border-[#00ff7f] shadow-[0_0_15px_rgba(0,255,127,0.3)]'  // Spring Green
    ];

    return (
        <section className="absolute inset-0 p-4 md:p-8 overflow-y-auto custom-scrollbar animate-slide-up bg-black/20">
            <div className="max-w-6xl mx-auto space-y-6 pb-20">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <h2 className="text-xl font-black italic text-white uppercase tracking-tighter drop-shadow-lg flex items-center gap-3">
                        <i className="fas fa-map-marked-alt text-indigo-500"></i>
                        LỘ TRÌNH HỌC TẬP
                    </h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowHiddenManager(true)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg uppercase tracking-wider text-slate-300 border border-slate-600 transition flex items-center gap-2"
                        >
                            <i className="fas fa-eye-slash"></i> Quản lý ẩn/hiện
                        </button>
                        <span className="px-3 py-1 bg-indigo-900/50 text-[9px] font-black rounded-lg uppercase tracking-widest text-indigo-300 border border-indigo-500/30 flex items-center">
                            {lessons.length} BÀI HỌC
                        </span>
                    </div>
                </div>
                
                {lessons.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                        <p className="font-black text-xs text-slate-500 uppercase tracking-widest">Chưa có dữ liệu bài học.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                        {lessons.map(lessonId => {
                            // Filter only 'vocab' type for counting total words
                            const lessonWords = db.vocab.filter(v => v.lesson === lessonId && v.type === 'vocab');
                            const masteredCount = lessonWords.filter(v => db.srs[v.id]?.status === 'review').length;
                            const progress = lessonWords.length > 0 ? Math.round((masteredCount / lessonWords.length) * 100) : 0;
                            const isLastPlayed = db.config.lastLessonId === lessonId;
                            const isHidden = hiddenSet.has(lessonId);

                            // Dynamic Neon Colors based on ID
                            const colorClass = NEON_COLORS[parseInt(lessonId) % NEON_COLORS.length];

                            if (isHidden) return null; // Hide completely from grid if hidden

                            return (
                                <Block 
                                    key={lessonId}
                                    colorClass={`${isLastPlayed ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.5)] scale-105 z-10' : `${colorClass} hover:border-white`}`}
                                    className={`relative aspect-square md:aspect-auto md:h-32 flex flex-col justify-center items-center p-4 bg-slate-900/80 hover:bg-slate-800 transition group cursor-pointer overflow-hidden text-center border-2`}
                                    onClick={() => onSelect(lessonId)}
                                >
                                    {isLastPlayed && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>}
                                    <div className="text-3xl md:text-4xl font-black text-white italic tracking-tighter group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                                        {lessonId}
                                    </div>
                                    <div className="text-[8px] font-black text-white/70 uppercase tracking-widest mt-1 group-hover:text-white transition-colors">
                                        {lessonWords.length} TỪ
                                    </div>
                                    <div className="mt-4 w-full px-2">
                                        <div className="h-1 bg-slate-950 rounded-full overflow-hidden border border-white/10 relative">
                                            <div className={`h-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                    {/* Percentage Display requested */}
                                    <div className="absolute bottom-2 right-2 text-[8px] font-black text-white/70 group-hover:text-white">
                                        {progress}%
                                    </div>
                                </Block>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Hidden Manager Modal */}
            {showHiddenManager && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-slide-up" onClick={() => setShowHiddenManager(false)}>
                    <div className="max-w-2xl w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4">
                            <h2 className="text-lg font-black text-white uppercase tracking-widest">Quản lý Ẩn/Hiện Bài học</h2>
                            <button onClick={() => setShowHiddenManager(false)} className="text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-2">
                            {lessons.map(lessonId => {
                                const isHidden = hiddenSet.has(lessonId);
                                return (
                                    <button 
                                        key={lessonId}
                                        onClick={(e) => toggleVisibility(e, lessonId)}
                                        className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition relative ${isHidden ? 'bg-slate-950 border-slate-800 text-slate-600' : 'bg-indigo-900/20 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]'}`}
                                    >
                                        <div className="text-2xl font-black italic">{lessonId}</div>
                                        <div className="text-[9px] font-bold uppercase mt-1">{isHidden ? 'Đang Ẩn' : 'Hiển thị'}</div>
                                        {isHidden && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                                                <i className="fas fa-eye-slash text-slate-500 text-xl"></i>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700 text-center">
                            <p className="text-[10px] text-slate-500 italic">Chọn bài học để ẩn hoặc hiện. Bài bị ẩn sẽ không xuất hiện trong lộ trình và ôn tập.</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
