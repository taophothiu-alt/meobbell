import React, { useState, useEffect } from 'react';
import { AppDatabase, Vocab } from '../../types';
import { saveDB, parseVocabString, getNextImportLessonId } from '../../services/storageService';
import { getAvailableVoices, speakText } from '../../services/audioService';

interface SettingsViewProps {
    db: AppDatabase;
    onClose: () => void;
    onUpdateDb: (newDb: AppDatabase) => void;
    onImport: (newVocab: Vocab[]) => void;
    onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
    onOpenExport: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ db, onClose, onUpdateDb, onImport, onNotify, onOpenExport }) => {
    const [soundEnabled, setSoundEnabled] = useState(db.config.soundEnabled ?? true);
    const [kanjiSize, setKanjiSize] = useState(db.config.kanjiSize);
    
    const [voicesJa, setVoicesJa] = useState<SpeechSynthesisVoice[]>([]);
    const [voicesVi, setVoicesVi] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedJa, setSelectedJa] = useState(db.config.voiceURI_ja || '');
    const [selectedVi, setSelectedVi] = useState(db.config.voiceURI_vi || '');

    // Data Factory State
    const [activeTab, setActiveTab] = useState<'general' | 'data'>('general');
    const [lessonNum, setLessonNum] = useState<string>("1");
    const [rawInput, setRawInput] = useState<string>("");
    const [autoDetectLesson, setAutoDetectLesson] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [pendingTab, setPendingTab] = useState<'general' | 'data' | null>(null);

    useEffect(() => {
        const loadVoices = () => {
            if (!('speechSynthesis' in window)) return;
            setVoicesJa(getAvailableVoices('ja'));
            setVoicesVi(getAvailableVoices('vi'));
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    // Auto-calculate next lesson ID on mount
    useEffect(() => {
        setLessonNum(getNextImportLessonId(db));
    }, [db]);

    const toggleSound = () => {
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        const newDb = { ...db, config: { ...db.config, soundEnabled: newState } };
        saveDB(newDb);
        onUpdateDb(newDb);
    };

    const updateKanjiSize = (size: number) => {
        setKanjiSize(size);
        const newDb = { ...db, config: { ...db.config, kanjiSize: size } };
        saveDB(newDb);
        onUpdateDb(newDb);
    };

    const updateVoice = (lang: 'ja' | 'vi', uri: string) => {
        const newConfig = { ...db.config };
        if (lang === 'ja') {
            setSelectedJa(uri);
            newConfig.voiceURI_ja = uri;
        } else {
            setSelectedVi(uri);
            newConfig.voiceURI_vi = uri;
        }
        const newDb = { ...db, config: newConfig };
        saveDB(newDb);
        onUpdateDb(newDb);
    };

    const handleImport = () => {
        if (!rawInput.trim()) {
            onNotify("Vui lòng dán dữ liệu vào ô trống", 'error');
            return;
        }
        
        const targetLesson = autoDetectLesson ? "AUTO" : lessonNum;
        const vocab = parseVocabString(rawInput, targetLesson);
        
        if (vocab.length > 0) {
            onImport(vocab);
            setRawInput(""); // Clear input after success
        } else {
            onNotify("Không tìm thấy dữ liệu hợp lệ. Kiểm tra định dạng JSON.", 'error');
        }
    };

    const handleTabClick = (tab: 'general' | 'data') => {
        if (tab === 'data') {
            setPendingTab('data');
            setShowPasswordModal(true);
            setPasswordInput("");
        } else {
            setActiveTab(tab);
        }
    };

    const verifyPassword = () => {
        if (passwordInput === "ph0n6123") {
            setShowPasswordModal(false);
            if (pendingTab === 'data') {
                setActiveTab('data');
                setPendingTab(null);
            } else {
                // Fallback for direct export if needed, but now we protect the tab
                onOpenExport(); 
            }
        } else {
            onNotify("Mật khẩu không đúng!", 'error');
        }
    };

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-slide-up overflow-y-auto">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative my-auto max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b border-slate-700 pb-4 shrink-0">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Cài đặt</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
                </div>

                {/* TABS */}
                <div className="flex gap-2 shrink-0">
                    <button 
                        onClick={() => handleTabClick('general')}
                        className={`flex-1 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition ${activeTab === 'general' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                    >
                        <i className="fas fa-sliders-h mr-2"></i> Chung
                    </button>
                    <button 
                        onClick={() => handleTabClick('data')}
                        className={`flex-1 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition ${activeTab === 'data' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                    >
                        <i className="fas fa-database mr-2"></i> Dữ liệu
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                    {activeTab === 'general' ? (
                        <div className="space-y-6">
                            {/* Sound Toggle */}
                            <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${soundEnabled ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-500'}`}>
                                        <i className={`fas ${soundEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm uppercase">Âm thanh ứng dụng</div>
                                        <div className="text-[10px] text-slate-400">Bật/tắt toàn bộ âm thanh (SFX, phát âm)</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={toggleSound}
                                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${soundEnabled ? 'bg-indigo-500' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${soundEnabled ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>

                            {/* Voice Selection */}
                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cài đặt Giọng đọc</div>
                                
                                {/* Japanese Voice */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-indigo-400 uppercase">Tiếng Nhật</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={selectedJa} 
                                            onChange={(e) => updateVoice('ja', e.target.value)}
                                            className="flex-1 bg-slate-800 text-white text-xs rounded-lg p-2 border border-slate-600 outline-none"
                                        >
                                            <option value="">Mặc định (Tự động)</option>
                                            {voicesJa.map(v => (
                                                <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                                            ))}
                                        </select>
                                        <button onClick={() => speakText('こんにちは', 'ja-JP')} className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white hover:bg-indigo-500 transition"><i className="fas fa-play text-xs"></i></button>
                                    </div>
                                </div>

                                {/* Vietnamese Voice */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-emerald-400 uppercase">Tiếng Việt (Hán Việt)</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={selectedVi} 
                                            onChange={(e) => updateVoice('vi', e.target.value)}
                                            className="flex-1 bg-slate-800 text-white text-xs rounded-lg p-2 border border-slate-600 outline-none"
                                        >
                                            <option value="">Mặc định (Tự động)</option>
                                            {voicesVi.map(v => (
                                                <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                                            ))}
                                        </select>
                                        <button onClick={() => speakText('Xin chào', 'vi-VN')} className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white hover:bg-emerald-500 transition"><i className="fas fa-play text-xs"></i></button>
                                    </div>
                                </div>
                            </div>

                            {/* Font Size */}
                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                <label className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <span>Cỡ chữ hiển thị (Hira/Kata/Kanji)</span>
                                    <span className="text-indigo-400">{kanjiSize}</span>
                                </label>
                                <input 
                                    type="range" min="80" max="300" step="10" 
                                    value={kanjiSize} 
                                    onChange={(e) => updateKanjiSize(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="h-24 flex items-center justify-center bg-black/30 rounded-xl border border-slate-800">
                                    <span className="font-serif text-white transition-all duration-200" style={{ fontSize: `${kanjiSize / 3}px` }}>永</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* IMPORT SECTION */}
                            <div className="space-y-4">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Nhập dữ liệu mới</div>
                                
                                <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                    <input 
                                        type="checkbox" 
                                        checked={autoDetectLesson} 
                                        onChange={(e) => setAutoDetectLesson(e.target.checked)}
                                        className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                                        id="autoDetect"
                                    />
                                    <label htmlFor="autoDetect" className="cursor-pointer flex-1">
                                        <div className="text-xs font-bold text-white uppercase">Tự động nhận diện bài học</div>
                                        <div className="text-[10px] text-slate-400">Dùng trường "lesson" trong JSON</div>
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
                                            className="w-20 font-black text-sm bg-black/50 text-white border border-slate-700 p-2 rounded-lg outline-none focus:border-emerald-500 text-center"
                                        />
                                    </div>
                                )}

                                <textarea 
                                    value={rawInput}
                                    onChange={(e) => setRawInput(e.target.value)}
                                    className="w-full h-40 text-[10px] font-mono leading-relaxed bg-black/50 text-slate-300 border border-slate-700 p-3 rounded-xl outline-none focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                                    placeholder='Dán JSON từ vựng vào đây...'
                                ></textarea>

                                <button 
                                    onClick={handleImport}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all border border-emerald-500/30"
                                >
                                    <i className="fas fa-file-import mr-2"></i> Xác nhận nạp
                                </button>
                            </div>

                            {/* EXPORT SECTION */}
                            <div className="space-y-4 pt-6 border-t border-slate-800">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Xuất dữ liệu</div>
                                <button 
                                    onClick={onOpenExport}
                                    className="w-full py-3 bg-sky-900/50 hover:bg-sky-800 text-sky-400 rounded-xl font-black uppercase tracking-widest text-xs border border-sky-600/50 transition flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-file-export"></i> Xuất dữ liệu
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 text-center shrink-0">
                    <div className="text-[10px] text-slate-600 font-mono">Version 1.0.0</div>
                </div>
            </div>

            {/* PASSWORD MODAL */}
            {showPasswordModal && (
                <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-slide-up">
                    <div className="max-w-sm w-full bg-slate-900 border-2 border-sky-600 rounded-3xl p-8 shadow-2xl relative flex flex-col space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-black text-sky-500 uppercase tracking-widest mb-2">Bảo mật</h2>
                            <p className="text-xs text-slate-400 font-bold">Nhập mật khẩu để tiếp tục xuất dữ liệu</p>
                        </div>
                        
                        <input 
                            type="password" 
                            autoFocus
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                            className="w-full bg-black/50 border border-slate-700 rounded-xl p-4 text-center text-white font-bold outline-none focus:border-sky-500 transition"
                            placeholder="Mật khẩu..."
                        />

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowPasswordModal(false)}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-bold uppercase text-xs"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={verifyPassword}
                                className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold uppercase text-xs shadow-lg shadow-sky-500/20"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
