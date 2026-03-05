
import React, { useState, useEffect } from 'react';
import { getJsonBinConfig } from '../../services/storageService';

interface SyncSettingsProps {
    onClose: () => void;
    onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SyncSettingsView: React.FC<SyncSettingsProps> = ({ onClose, onNotify }) => {
    const [secret, setSecret] = useState("");
    const [binId, setBinId] = useState("");

    useEffect(() => {
        const config = getJsonBinConfig();
        setSecret(config.secret);
        setBinId(config.binId);
    }, []);

    const handleSave = () => {
        if (!secret.trim() || !binId.trim()) {
            onNotify("Vui lòng nhập đầy đủ thông tin", 'error');
            return;
        }
        localStorage.setItem('JSONBIN_SECRET', secret.trim());
        localStorage.setItem('JSONBIN_BIN_ID', binId.trim());
        onNotify("Đã lưu cấu hình đồng bộ. Vui lòng tải lại trang.", 'success');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };

    const handleClear = () => {
        localStorage.removeItem('JSONBIN_SECRET');
        localStorage.removeItem('JSONBIN_BIN_ID');
        setSecret("");
        setBinId("");
        onNotify("Đã xóa cấu hình đồng bộ", 'info');
    };

    return (
        <section className="absolute inset-0 p-8 overflow-y-auto custom-scrollbar animate-slide-up bg-black/80 backdrop-blur-md z-[100]">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex justify-between items-center border-l-4 border-indigo-500 pl-4">
                    <h2 className="text-2xl font-black italic uppercase text-white tracking-widest">Cài đặt đồng bộ</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div className="rounded-[1.25rem] border-[2.5px] border-indigo-500/30 p-8 space-y-6 bg-slate-900/50">
                    <div className="space-y-4">
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 leading-relaxed">
                            <i className="fas fa-info-circle mr-2"></i>
                            Cấu hình này giúp bạn đồng bộ danh sách từ vựng giữa các thiết bị. 
                            Dữ liệu tiến độ học tập (SRS) vẫn sẽ được lưu riêng trên từng máy.
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">JSONBin API Key (X-Master-Key)</label>
                            <input 
                                type="password" 
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                className="w-full font-mono text-sm bg-[#020617] text-[#f8fafc] border-[2.5px] border-[#1e293b] p-4 rounded-xl outline-none focus:border-indigo-500 transition-all"
                                placeholder="Nhập API Key của bạn..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">JSONBin Bin ID</label>
                            <input 
                                type="text" 
                                value={binId}
                                onChange={(e) => setBinId(e.target.value)}
                                className="w-full font-mono text-sm bg-[#020617] text-[#f8fafc] border-[2.5px] border-[#1e293b] p-4 rounded-xl outline-none focus:border-indigo-500 transition-all"
                                placeholder="Nhập Bin ID của bạn..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={handleClear}
                            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
                        >
                            Xóa cấu hình
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex-[2] py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl transition-all border border-indigo-500/30"
                        >
                            Lưu & Kích hoạt
                        </button>
                    </div>

                    <div className="mt-8 border-t border-slate-800 pt-6">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Hướng dẫn nhanh</h3>
                        <ol className="text-[11px] text-slate-400 space-y-3 ml-4 list-decimal">
                            <li>Truy cập <a href="https://jsonbin.io" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">JSONBin.io</a> và đăng nhập.</li>
                            <li>Tạo một Bin mới với nội dung là <code className="bg-black px-1 rounded text-emerald-400">[]</code>.</li>
                            <li>Copy <b>Bin ID</b> từ tab Metadata của Bin đó.</li>
                            <li>Vào phần <b>API Keys</b> để lấy <b>X-Master-Key</b>.</li>
                            <li>Dán cả hai vào ô trên và nhấn Lưu.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </section>
    );
};
