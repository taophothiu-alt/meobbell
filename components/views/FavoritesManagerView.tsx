import React, { useState, useMemo } from 'react';
import { AppDatabase, Vocab, FavoriteGroup } from '../../types';
import { saveDB } from '../../services/storageService';
import { motion, AnimatePresence } from 'framer-motion';

interface FavoritesManagerViewProps {
    db: AppDatabase;
    onUpdateDb: (newDb: AppDatabase) => void;
    onClose: () => void;
    onJumpToStudy: (lessonId: string, type: 'vocab' | 'kanji') => void;
}

const COLORS = [
    { name: 'Red', class: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-400' },
    { name: 'Orange', class: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400' },
    { name: 'Amber', class: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400' },
    { name: 'Green', class: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-400' },
    { name: 'Emerald', class: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    { name: 'Teal', class: 'border-teal-500', bg: 'bg-teal-500/10', text: 'text-teal-400' },
    { name: 'Cyan', class: 'border-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    { name: 'Sky', class: 'border-sky-500', bg: 'bg-sky-500/10', text: 'text-sky-400' },
    { name: 'Blue', class: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
    { name: 'Indigo', class: 'border-indigo-500', bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
    { name: 'Violet', class: 'border-violet-500', bg: 'bg-violet-500/10', text: 'text-violet-400' },
    { name: 'Purple', class: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400' },
    { name: 'Fuchsia', class: 'border-fuchsia-500', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400' },
    { name: 'Pink', class: 'border-pink-500', bg: 'bg-pink-500/10', text: 'text-pink-400' },
    { name: 'Rose', class: 'border-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-400' },
];

export const FavoritesManagerView: React.FC<FavoritesManagerViewProps> = ({ db, onUpdateDb, onClose, onJumpToStudy }) => {
    const [selectedLesson, setSelectedLesson] = useState<string>('ALL');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupColor, setNewGroupColor] = useState(COLORS[0]);

    // Derived Data
    const allFavorites = useMemo(() => {
        return db.vocab.filter(v => db.favorites.includes(String(v.id)));
    }, [db.vocab, db.favorites]);

    const lessons = useMemo(() => {
        const set = new Set(allFavorites.map(v => v.lesson));
        return Array.from(set).sort((a, b) => parseInt(a) - parseInt(b));
    }, [allFavorites]);

    const filteredFavorites = useMemo(() => {
        if (selectedLesson === 'ALL') return allFavorites;
        return allFavorites.filter(v => v.lesson === selectedLesson);
    }, [allFavorites, selectedLesson]);

    // Group Logic
    const handleCreateGroup = () => {
        if (!newGroupName.trim()) return;
        const newGroup: FavoriteGroup = {
            id: Date.now().toString(),
            name: newGroupName,
            color: newGroupColor.class,
            itemIds: []
        };
        const newDb = { ...db, favoriteGroups: [...(db.favoriteGroups || []), newGroup] };
        saveDB(newDb);
        onUpdateDb(newDb);
        setIsCreatingGroup(false);
        setNewGroupName('');
    };

    const handleDeleteGroup = (groupId: string) => {
        if (!confirm('Bạn có chắc muốn xóa nhóm này?')) return;
        const newDb = { ...db, favoriteGroups: db.favoriteGroups.filter(g => g.id !== groupId) };
        saveDB(newDb);
        onUpdateDb(newDb);
        if (selectedGroupId === groupId) setSelectedGroupId(null);
    };

    const toggleItemInGroup = (vocabId: string, groupId: string) => {
        const groupIndex = db.favoriteGroups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;

        const group = db.favoriteGroups[groupIndex];
        const isInGroup = group.itemIds.includes(vocabId);
        
        let newIds;
        if (isInGroup) {
            newIds = group.itemIds.filter(id => id !== vocabId);
        } else {
            newIds = [...group.itemIds, vocabId];
        }

        // Allow multi-group assignment (non-exclusive)
        const newGroups = db.favoriteGroups.map(g => {
            if (g.id === groupId) {
                return { ...g, itemIds: newIds };
            }
            return g;
        });

        const newDb = { ...db, favoriteGroups: newGroups };
        saveDB(newDb);
        onUpdateDb(newDb);
    };

    // View Logic
    const groupedItems = useMemo(() => {
        const groups: Record<string, Vocab[]> = {};
        const overviewGroups: Record<string, Vocab[]> = {}; // For overview display (priority based)
        const assignedIds = new Set<string>();
        const itemGroupCounts: Record<string, number> = {};

        // Initialize groups
        db.favoriteGroups.forEach(g => {
            groups[g.id] = [];
            overviewGroups[g.id] = [];
        });

        // Calculate item group counts
        db.favoriteGroups.forEach(g => {
            g.itemIds.forEach(id => {
                itemGroupCounts[id] = (itemGroupCounts[id] || 0) + 1;
            });
        });

        // Assign items
        filteredFavorites.forEach(v => {
            let assignedToOverview = false;

            db.favoriteGroups.forEach(g => {
                if (g.itemIds.includes(String(v.id))) {
                    // Add to specific group list (for group details view)
                    groups[g.id].push(v);
                    assignedIds.add(String(v.id));

                    // Add to overview list ONLY if it's the first group encountered (priority)
                    if (!assignedToOverview) {
                        overviewGroups[g.id].push(v);
                        assignedToOverview = true;
                    }
                }
            });
        });

        const ungrouped = filteredFavorites.filter(v => !assignedIds.has(String(v.id)));

        return { groups, overviewGroups, ungrouped, itemGroupCounts };
    }, [filteredFavorites, db.favoriteGroups]);

    const getBorderClass = (v: Vocab, defaultBorder: string) => {
        const count = groupedItems.itemGroupCounts[String(v.id)] || 0;
        if (count > 1) {
            // Mixed border style for multi-group items
            return "border-double border-4 border-transparent bg-clip-padding [background-image:linear-gradient(to_right,#1e293b,#1e293b),linear-gradient(to_right,#f472b6,#fbbf24)] bg-origin-border";
        }
        return `border ${defaultBorder}`;
    };

    return (
        <div className="absolute inset-0 bg-slate-950 z-40 flex flex-col animate-fade-in">
            {/* Header & Controls */}
            <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur shrink-0 z-10">
                {/* Top Bar: Back, Title, Filter */}
                <div className="h-14 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition">
                            <i className="fas fa-arrow-left text-xs"></i>
                        </button>
                        <div>
                            <h1 className="text-sm font-black text-white uppercase tracking-wider">Kho Yêu Thích</h1>
                            <div className="text-[9px] text-slate-500 font-bold">{allFavorites.length} từ</div>
                        </div>
                    </div>
                    
                    <select 
                        value={selectedLesson} 
                        onChange={(e) => setSelectedLesson(e.target.value)}
                        className="bg-slate-800 text-white text-[10px] font-bold rounded-lg px-2 py-1.5 border border-slate-700 outline-none focus:border-indigo-500 max-w-[120px]"
                    >
                        <option value="ALL">Tất cả bài</option>
                        {lessons.map(l => <option key={l} value={l}>Bài {l}</option>)}
                    </select>
                </div>

                {/* Horizontal Group Chips */}
                <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setSelectedGroupId(null)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition flex items-center gap-2 ${selectedGroupId === null ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                    >
                        <span>Tất cả</span>
                        <span className={`px-1.5 rounded-full text-[9px] ${selectedGroupId === null ? 'bg-slate-200 text-slate-800' : 'bg-slate-700 text-slate-300'}`}>{groupedItems.ungrouped.length + Object.values(groupedItems.groups).reduce((a, b) => a + b.length, 0)}</span>
                    </button>

                    {db.favoriteGroups.map(g => (
                        <button 
                            key={g.id}
                            onClick={() => setSelectedGroupId(g.id)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition flex items-center gap-2 ${selectedGroupId === g.id ? `bg-slate-800 text-white ${g.color}` : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${g.color.replace('border-', 'bg-')}`}></div>
                            <span>{g.name}</span>
                            <span className="bg-slate-700 px-1.5 rounded-full text-[9px] text-slate-300">{groupedItems.groups[g.id]?.length || 0}</span>
                        </button>
                    ))}

                    <button 
                        onClick={() => setIsCreatingGroup(true)}
                        className="shrink-0 w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition"
                    >
                        <i className="fas fa-plus text-[10px]"></i>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-slate-950 p-3 md:p-4">
                {/* Create Group Modal */}
                <AnimatePresence>
                    {isCreatingGroup && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                                <h3 className="text-white font-bold uppercase text-sm">Tạo nhóm mới</h3>
                                <input 
                                    type="text" 
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Tên nhóm (VD: Động từ, Khó nhớ...)"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-indigo-500"
                                    autoFocus
                                />
                                <div className="grid grid-cols-5 gap-2">
                                    {COLORS.map(c => (
                                        <button 
                                            key={c.name}
                                            onClick={() => setNewGroupColor(c)}
                                            className={`h-8 rounded-lg border-2 transition ${c.bg} ${newGroupColor.name === c.name ? c.class : 'border-transparent hover:border-white/20'}`}
                                        ></button>
                                    ))}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => setIsCreatingGroup(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs uppercase hover:bg-slate-700">Hủy</button>
                                    <button onClick={handleCreateGroup} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase hover:bg-indigo-500 shadow-lg shadow-indigo-500/20">Tạo nhóm</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                <div className="space-y-6 pb-20">
                    {selectedGroupId ? (
                        /* SINGLE GROUP VIEW */
                        <>
                            {/* Group Actions Toolbar */}
                            <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${db.favoriteGroups.find(g => g.id === selectedGroupId)?.color.replace('border-', 'bg-')}`}></span>
                                    <span className="text-xs font-black text-white uppercase">{db.favoriteGroups.find(g => g.id === selectedGroupId)?.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => onJumpToStudy(groupedItems.groups[selectedGroupId]?.[0]?.lesson || '1', 'vocab')}
                                        className="px-3 py-1.5 bg-indigo-600 rounded-lg text-[10px] font-bold text-white uppercase hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20"
                                    >
                                        <i className="fas fa-play mr-1"></i> Học nhóm này
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteGroup(selectedGroupId)}
                                        className="w-7 h-7 rounded-lg bg-rose-900/20 text-rose-500 hover:bg-rose-600 hover:text-white flex items-center justify-center transition"
                                    >
                                        <i className="fas fa-trash text-[10px]"></i>
                                    </button>
                                </div>
                            </div>

                            {/* IN GROUP */}
                            <div>
                                <div className="text-[10px] font-bold text-emerald-400 uppercase mb-2 flex items-center gap-1 opacity-80">
                                    <i className="fas fa-check-circle"></i> Đã có trong nhóm
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                    {groupedItems.groups[selectedGroupId]?.map(v => (
                                        <div 
                                            key={v.id} 
                                            onClick={() => toggleItemInGroup(String(v.id), selectedGroupId)}
                                            className={`p-3 rounded-xl bg-slate-900 cursor-pointer transition relative group ${getBorderClass(v, db.favoriteGroups.find(g => g.id === selectedGroupId)?.color || '')}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="text-base font-black text-white">{v.kj !== '-' ? v.kj : v.ka}</div>
                                                <i className="fas fa-check-circle text-emerald-500 text-[10px]"></i>
                                            </div>
                                            <div className="text-[10px] text-slate-400 truncate">{v.mean}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* NOT IN GROUP */}
                            <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 mt-6 opacity-80">Chưa có nhóm (Click để thêm)</div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                    {groupedItems.ungrouped.map(v => (
                                        <div 
                                            key={v.id} 
                                            onClick={() => toggleItemInGroup(String(v.id), selectedGroupId)}
                                            className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-600 cursor-pointer transition opacity-60 hover:opacity-100"
                                        >
                                            <div className="text-base font-black text-white mb-1">{v.kj !== '-' ? v.kj : v.ka}</div>
                                            <div className="text-[10px] text-slate-400 truncate">{v.mean}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* ALL GROUPS OVERVIEW */
                        <>
                            {db.favoriteGroups.map(g => (
                                <div key={g.id}>
                                    <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-1">
                                        <h3 className="text-xs font-black text-white uppercase flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${g.color.replace('border-', 'bg-')}`}></span>
                                            {g.name}
                                        </h3>
                                        <button onClick={() => setSelectedGroupId(g.id)} className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 uppercase">Chi tiết</button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                        {groupedItems.overviewGroups[g.id]?.length > 0 ? groupedItems.overviewGroups[g.id].map(v => (
                                            <div key={v.id} className={`p-3 rounded-xl bg-slate-900 ${getBorderClass(v, g.color)}`}>
                                                <div className="text-base font-black text-white mb-1">{v.kj !== '-' ? v.kj : v.ka}</div>
                                                <div className="text-[10px] text-slate-400 truncate">{v.mean}</div>
                                            </div>
                                        )) : <div className="text-[10px] text-slate-600 italic col-span-full">Chưa có từ nào</div>}
                                    </div>
                                </div>
                            ))}

                            {/* Ungrouped Section */}
                            <div>
                                <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-1">
                                    <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                                        Chưa phân nhóm
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                    {groupedItems.ungrouped.map(v => (
                                        <div key={v.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                                            <div className="text-base font-black text-white mb-1">{v.kj !== '-' ? v.kj : v.ka}</div>
                                            <div className="text-[10px] text-slate-400 truncate">{v.mean}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
