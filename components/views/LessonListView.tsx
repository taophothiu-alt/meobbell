
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
    // Show ALL lessons for the modal, but filter for the grid
    const allLessons = (Array.from(new Set(db.vocab.map(v => v.lesson))) as string[])
        .sort((a, b) => parseInt(a) - parseInt(b));
    
    const visibleLessons = allLessons.filter(lid => !hiddenSet.has(lid));

    const [showManageModal, setShowManageModal] = React.useState(false);

    const toggleVisibility = (lessonId: string) => {
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
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowManageModal(true)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-black rounded-lg uppercase tracking-widest text-slate-300 border border-slate-600 transition flex items-center gap-2"
                        >
                            <i className="fas fa-eye-slash"></i> Ẩn/Hiện Bài
                        </button>
                        <span className="px-3 py-1 bg-indigo-900/50 text-[9px] font-black rounded-lg uppercase tracking-widest text-indigo-300 border border-indigo-500/30">
                            {visibleLessons.length} BÀI HỌC
                        </span>
                    </div>
                </div>
                
                {visibleLessons.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                        <p className="font-black text-xs text-slate-500 uppercase tracking-widest">Chưa có dữ liệu bài học hoặc tất cả đã bị ẩn.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                        {visibleLessons.map(lessonId => {
                            // Filter only 'vocab' type for counting total words
                            const lessonWords = db.vocab.filter(v => v.lesson === lessonId && v.type === 'vocab');
                            const masteredCount = lessonWords.filter(v => db.srs[v.id]?.status === 'review').length;
                            const progress = lessonWords.length > 0 ? Math.round((masteredCount / lessonWords.length) * 100) : 0;
                            const isLastPlayed = db.config.lastLessonId === lessonId;
                            const customName = db.lessonNames?.[lessonId];

                            // Dynamic Neon Colors based on ID
                            const colorClass = NEON_COLORS[parseInt(lessonId) % NEON_COLORS.length];

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
                                    {customName && (
                                        <div className="text-[10px] font-bold text-indigo-300 uppercase truncate max-w-full px-1">
                                            {customName}
                                        </div>
                                    )}
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

            {/* MANAGE VISIBILITY MODAL */}
            {showManageModal && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-slide-up" onClick={() => setShowManageModal(false)}>
                    <div className="max-w-2xl w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4 shrink-0">
                            <h2 className="text-lg font-black text-white uppercase tracking-widest">Quản lý hiển thị bài học</h2>
                            <button onClick={() => setShowManageModal(false)} className="text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
                        </div>
                        
                        <div className="text-xs text-slate-400 mb-4 px-1">
                            Chọn các bài học bạn muốn <span className="text-rose-400 font-bold">ẨN</span> khỏi lộ trình.
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 overflow-y-auto custom-scrollbar p-2 flex-1 min-h-0">
                            {allLessons.map(lid => {
                                const isHidden = hiddenSet.has(lid);
                                return (
                                    <button
                                        key={lid}
                                        onClick={() => toggleVisibility(lid)}
                                        className={`
                                            aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all relative overflow-hidden group
                                            ${isHidden 
                                                ? 'bg-rose-900/20 border-rose-500 text-rose-500' 
                                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-white'
                                            }
                                        `}
                                    >
                                        <div className="text-xl font-black italic">{lid}</div>
                                        {isHidden && (
                                            <div className="absolute inset-0 bg-rose-500/10 flex items-center justify-center">
                                                <i className="fas fa-eye-slash text-rose-500 text-lg"></i>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end shrink-0">
                            <button 
                                onClick={() => setShowManageModal(false)}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase text-xs shadow-lg shadow-emerald-500/20"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
