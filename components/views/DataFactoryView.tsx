
import React, { useState, useEffect } from 'react';
import { parseVocabString, getNextImportLessonId, saveDB } from '../../services/storageService';
import { fetchMasterData, saveMasterData } from '../../services/masterDataService';
import { Vocab, AppDatabase } from '../../types';

interface DataFactoryProps {
    db: AppDatabase;
    onImport: (newVocab: Vocab[]) => void;
    onClose: () => void;
    onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
    onUpdateDb: (newDb: AppDatabase) => void;
    onOpenMasterData: () => void;
}

export const DataFactoryView: React.FC<DataFactoryProps> = ({ db, onImport, onClose, onNotify, onUpdateDb, onOpenMasterData }) => {
    const [lessonNum, setLessonNum] = useState<string>("1");
    const [rawInput, setRawInput] = useState<string>("");
    const [autoDetectLesson, setAutoDetectLesson] = useState(false);
    const [showHideModal, setShowHideModal] = useState(false);
    const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set(db.hiddenLessons || []));
    const [isImporting, setIsImporting] = useState(false);

    // Auto-calculate next lesson ID on mount
    useEffect(() => {
        setLessonNum(getNextImportLessonId(db));
    }, [db]);

    const handleImport = async () => {
        if (!rawInput.trim()) {
            onNotify("Vui lòng dán dữ liệu vào ô trống", 'error');
            return;
        }
        
        setIsImporting(true);
        const targetLesson = autoDetectLesson ? "AUTO" : lessonNum;
        const vocab = parseVocabString(rawInput, targetLesson);
        
        if (vocab.length > 0) {
            try {
                // 1. Save to Local DB (Standard behavior)
                onImport(vocab);

                // 2. Save to Server Master Data (New requirement)
                const currentMaster = await fetchMasterData();
                
                // Merge logic: Append new items, avoid duplicates by ID if possible
                // Since parseVocabString might generate IDs, we should be careful.
                // But usually bulk import implies new data.
                // Let's filter out items that already exist in master data by ID
                const existingIds = new Set(currentMaster.map(v => String(v.id)));
                const newItems = vocab.filter(v => !existingIds.has(String(v.id)));
                
                if (newItems.length > 0) {
                    const updatedMaster = [...currentMaster, ...newItems];
                    const success = await saveMasterData(updatedMaster);
                    if (success) {
                        onNotify(`Đã nạp ${vocab.length} từ và lưu vào Server thành công!`, 'success');
                    } else {
                        onNotify(`Đã nạp vào máy nhưng lỗi lưu Server!`, 'error');
                    }
                } else {
                    onNotify(`Đã nạp ${vocab.length} từ (trùng lặp trên Server nên không lưu thêm)`, 'info');
                }

                onClose();
            } catch (e) {
                console.error(e);
                onNotify("Lỗi khi xử lý dữ liệu", 'error');
            }
        } else {
            onNotify("Không tìm thấy dữ liệu hợp lệ. Kiểm tra định dạng JSON.", 'error');
        }
        setIsImporting(false);
    };

    const toggleLessonSelection = (lid: string) => {
        const newSet = new Set(selectedLessons);
        if (newSet.has(lid)) {
            newSet.delete(lid);
        } else {
            newSet.add(lid);
        }
        setSelectedLessons(newSet);
    };

    const saveHiddenLessons = () => {
        const newHidden = Array.from(selectedLessons);
        const newDb = { ...db, hiddenLessons: newHidden };
        saveDB(newDb);
        onUpdateDb(newDb);
        setShowHideModal(false);
        onNotify("Đã cập nhật trạng thái hiển thị bài học", 'success');
    };

    const allLessons = Array.from(new Set(db.vocab.map(v => v.lesson))).sort((a, b) => parseInt(a) - parseInt(b));

    const handleExportForCode = () => {
        const json = JSON.stringify(db.vocab, null, 4);
        // Copy to clipboard
        navigator.clipboard.writeText(json).then(() => {
            onNotify("Đã sao chép dữ liệu! Dán vào file src/data/staticData.ts", 'success');
        }).catch(() => {
            onNotify("Lỗi sao chép", 'error');
        });
    };

    return (
        <section className="absolute inset-0 p-8 overflow-y-auto custom-scrollbar animate-slide-up bg-black/80 backdrop-blur-md">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center border-l-4 border-emerald-500 pl-4">
                    <h2 className="text-2xl font-black italic uppercase text-white tracking-widest">Xưởng dữ liệu</h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={onOpenMasterData}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center gap-2 animate-pulse"
                        >
                            <i className="fas fa-database"></i> Quản lý Dữ liệu Gốc (Server)
                        </button>
                        <button 
                            onClick={handleExportForCode}
                            className="px-4 py-2 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-300 rounded-lg text-xs font-bold uppercase tracking-wider border border-indigo-500/30 transition flex items-center gap-2"
                            title="Xuất dữ liệu để dán vào mã nguồn (staticData.ts)"
                        >
                            <i className="fas fa-code"></i> Xuất mã nguồn
                        </button>
                        <button 
                            onClick={() => setShowHideModal(true)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-600 transition flex items-center gap-2"
                        >
                            <i className="fas fa-eye-slash"></i> Quản lý hiển thị
                        </button>
                    </div>
                </div>
                
                {/* ... (rest of the JSX) */}
                
                <div className="rounded-[1.25rem] border-[2.5px] border-emerald-500/30 p-8 space-y-6 bg-slate-900/50">
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">CẤU HÌNH NHẬP LIỆU</label>
                        
                        {/* AUTO DETECT TOGGLE */}
                        <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/10">
                            <input 
                                type="checkbox" 
                                checked={autoDetectLesson} 
                                onChange={(e) => setAutoDetectLesson(e.target.checked)}
                                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                                id="autoDetect"
                            />
                            <label htmlFor="autoDetect" className="cursor-pointer">
                                <div className="text-xs font-bold text-white uppercase">Nạp tự động</div>
                            </label>
                        </div>

                        {!autoDetectLesson && (
                            <div className="flex items-center gap-2 animate-slide-up">
                                <span className="text-xs font-bold text-slate-400">Ghi đè vào bài số:</span>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="99" 
                                    value={lessonNum} 
                                    onChange={(e) => setLessonNum(e.target.value)}
                                    className="w-24 font-black text-lg bg-[#020617] text-[#f8fafc] border-[2.5px] border-[#1e293b] p-3 rounded-xl outline-none focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] text-center"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 relative">
                        <textarea 
                            value={rawInput}
                            onChange={(e) => setRawInput(e.target.value)}
                            className="w-full h-72 text-[12px] font-mono leading-relaxed bg-[#020617] text-[#f8fafc] border-[2.5px] border-[#1e293b] p-4 rounded-xl outline-none focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                            placeholder='Dán vào đây'
                        ></textarea>
                    </div>

                    <button 
                        onClick={handleImport}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-xl transition-all border border-emerald-500/30"
                    >
                        Xác nhận nạp bài học
                    </button>
                </div>
            </div>

            {/* HIDE LESSONS MODAL */}
            {showHideModal && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-slide-up">
                    <div className="max-w-2xl w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4 shrink-0">
                            <h2 className="text-lg font-black text-white uppercase tracking-widest">Ẩn/Hiện Dữ Liệu</h2>
                            <button onClick={() => setShowHideModal(false)} className="text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
                        </div>
                        
                        <div className="text-xs text-slate-400 mb-4 px-1">
                            Chọn các bài học bạn muốn <span className="text-rose-400 font-bold">ẨN</span> khỏi lộ trình và ôn tập.
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 overflow-y-auto custom-scrollbar p-2 flex-1 min-h-0">
                            {allLessons.map(lid => {
                                const isHidden = selectedLessons.has(lid);
                                return (
                                    <button
                                        key={lid}
                                        onClick={() => toggleLessonSelection(lid)}
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

                        <div className="mt-6 pt-4 border-t border-slate-700 flex gap-3 shrink-0">
                            <button 
                                onClick={() => setShowHideModal(false)}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-bold uppercase text-xs"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={saveHiddenLessons}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase text-xs shadow-lg shadow-emerald-500/20"
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
