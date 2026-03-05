import React, { useState, useEffect, useMemo } from 'react';
import { Vocab } from '../../types';
import { fetchMasterData, saveMasterData } from '../../services/masterDataService';

interface MasterDataManagerProps {
    onClose: () => void;
    onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const MasterDataManagerView: React.FC<MasterDataManagerProps> = ({ onClose, onNotify }) => {
    const [data, setData] = useState<Vocab[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [editingItem, setEditingItem] = useState<Vocab | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const serverData = await fetchMasterData();
        setData(serverData);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!editingItem) return;
        
        let newData = [...data];
        if (isCreating) {
            newData.push(editingItem);
        } else {
            const idx = newData.findIndex(v => String(v.id) === String(editingItem.id));
            if (idx >= 0) newData[idx] = editingItem;
        }

        const success = await saveMasterData(newData);
        if (success) {
            setData(newData);
            setEditingItem(null);
            setIsCreating(false);
            onNotify("Đã lưu dữ liệu gốc thành công!", 'success');
        } else {
            onNotify("Lỗi khi lưu dữ liệu!", 'error');
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!confirm("Bạn có chắc muốn xóa từ này khỏi dữ liệu gốc?")) return;
        const newData = data.filter(v => String(v.id) !== String(id));
        const success = await saveMasterData(newData);
        if (success) {
            setData(newData);
            onNotify("Đã xóa thành công!", 'success');
        } else {
            onNotify("Lỗi khi xóa!", 'error');
        }
    };

    const filteredData = useMemo(() => {
        if (!filter) return data;
        const lower = filter.toLowerCase();
        return data.filter(v => 
            v.kj.toLowerCase().includes(lower) || 
            v.ka.toLowerCase().includes(lower) || 
            v.mean.toLowerCase().includes(lower) ||
            v.lesson === filter
        );
    }, [data, filter]);

    const startCreate = () => {
        const newId = `manual_${Date.now()}`;
        setEditingItem({
            id: newId,
            lesson: '1',
            type: 'vocab',
            kj: '',
            ka: '',
            mean: '',
            ro: '',
            hv: '',
            on: '-',
            kun: '-',
            en: '-'
        });
        setIsCreating(true);
    };

    return (
        <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col animate-fade-in">
            {/* Header */}
            <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition">
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-white uppercase tracking-wider text-emerald-500">Quản lý Dữ liệu Gốc (Server)</h1>
                        <div className="text-xs text-slate-500 font-bold">Dữ liệu này sẽ được lưu cứng trên máy chủ</div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm..." 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white font-bold outline-none focus:border-emerald-500 w-64"
                        />
                    </div>
                    <button 
                        onClick={startCreate}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i> Thêm từ mới
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="text-center text-slate-500 py-20">Đang tải dữ liệu từ server...</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredData.map(v => (
                                <div key={v.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between group hover:border-emerald-500/50 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 font-black text-xs border border-slate-700">
                                            {v.lesson}
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-lg font-black text-white">{v.kj !== '-' ? v.kj : v.ka}</span>
                                                <span className="text-xs font-bold text-emerald-400">{v.ka}</span>
                                            </div>
                                            <div className="text-xs text-slate-400">{v.mean}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                        <button 
                                            onClick={() => { setEditingItem(v); setIsCreating(false); }}
                                            className="px-3 py-1.5 bg-indigo-900/30 text-indigo-400 rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-600 hover:text-white transition"
                                        >
                                            Sửa
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(v.id)}
                                            className="px-3 py-1.5 bg-rose-900/30 text-rose-400 rounded-lg text-[10px] font-bold uppercase hover:bg-rose-600 hover:text-white transition"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filteredData.length === 0 && (
                                <div className="text-center text-slate-500 py-10 italic">Không tìm thấy dữ liệu</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Editor Panel (Right Side) */}
                {editingItem && (
                    <div className="w-96 bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto shadow-2xl z-10 animate-slide-left flex flex-col">
                        <h3 className="text-lg font-black text-white uppercase mb-6 flex items-center gap-2 shrink-0">
                            {isCreating ? <i className="fas fa-plus-circle text-emerald-500"></i> : <i className="fas fa-edit text-indigo-500"></i>}
                            {isCreating ? 'Thêm từ mới' : 'Chỉnh sửa từ'}
                        </h3>
                        
                        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bài học</label>
                                    <input type="text" value={editingItem.lesson} onChange={e => setEditingItem({...editingItem, lesson: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-bold outline-none focus:border-emerald-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Loại</label>
                                    <select value={editingItem.type} onChange={e => setEditingItem({...editingItem, type: e.target.value as 'vocab'|'kanji'})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-bold outline-none focus:border-emerald-500">
                                        <option value="vocab">Từ vựng</option>
                                        <option value="kanji">Kanji</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Kanji (Hán tự)</label>
                                <input type="text" value={editingItem.kj} onChange={e => setEditingItem({...editingItem, kj: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-lg font-serif outline-none focus:border-emerald-500" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Kana (Cách đọc)</label>
                                <input type="text" value={editingItem.ka} onChange={e => setEditingItem({...editingItem, ka: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 text-sm font-bold outline-none focus:border-emerald-500" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Hán Việt</label>
                                <input type="text" value={editingItem.hv} onChange={e => setEditingItem({...editingItem, hv: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Nghĩa tiếng Việt</label>
                                <textarea value={editingItem.mean} onChange={e => setEditingItem({...editingItem, mean: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 h-24 resize-none" />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3 shrink-0 border-t border-slate-800 mt-4">
                            <button onClick={() => setEditingItem(null)} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold uppercase text-xs hover:bg-slate-700">Hủy</button>
                            <button onClick={handleSave} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-emerald-500 shadow-lg shadow-emerald-500/20">Lưu ngay</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
