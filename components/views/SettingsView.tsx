import React, { useState, useEffect } from 'react';
import { AppDatabase } from '../../types';
import { saveDB } from '../../services/storageService';
import { getAvailableVoices, speakText } from '../../services/audioService';

interface SettingsViewProps {
    db: AppDatabase;
    onClose: () => void;
    onUpdateDb: (newDb: AppDatabase) => void;
    onOpenExport: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ db, onClose, onUpdateDb, onOpenExport }) => {
    const [soundEnabled, setSoundEnabled] = useState(db.config.soundEnabled ?? true);
    const [kanjiSize, setKanjiSize] = useState(db.config.kanjiSize);
    
    const [voicesJa, setVoicesJa] = useState<SpeechSynthesisVoice[]>([]);
    const [voicesVi, setVoicesVi] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedJa, setSelectedJa] = useState(db.config.voiceURI_ja || '');
    const [selectedVi, setSelectedVi] = useState(db.config.voiceURI_vi || '');

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

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-slide-up overflow-y-auto">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative my-auto">
                <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Cài đặt</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
                </div>

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

                    {/* Export Data */}
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Xuất dữ liệu</div>
                        <button onClick={onOpenExport} className="w-full py-4 bg-sky-900/50 border border-sky-600/50 rounded-xl text-sky-400 font-bold text-xs uppercase hover:bg-sky-800 transition flex items-center justify-center gap-2">
                            <i className="fas fa-file-export"></i> Mở Menu Xuất
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <div className="text-[10px] text-slate-600 font-mono">Version 1.0.0</div>
                </div>
            </div>
        </div>
    );
};
