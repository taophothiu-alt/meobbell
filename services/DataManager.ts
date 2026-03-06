import { AppDatabase, STORAGE_KEY, UserStats } from '../types';
import { STATIC_VOCAB } from '../data/vocab_db';

const DEFAULT_STATS: UserStats = {
    xp: 0,
    level: 1,
    streak: 0,
    score: 0,
    lastStudyDate: "",
    title: "Tân binh"
};

const DEFAULT_CONFIG = {
    kanjiSize: 90,
    autoPlayAudio: true,
    soundEnabled: true,
    writingTimer: 0,
    writingMode: 'sequential' as const
};

export const DataManager = {
    /**
     * Loads the database from LocalStorage and merges it with Static Data.
     * This ensures that the vocabulary list is always up-to-date with the code,
     * while preserving user progress (SRS, Stats, etc.).
     */
    initializeDatabase: (): AppDatabase => {
        let db: AppDatabase;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                // 1. Parse LocalStorage
                const parsed = JSON.parse(stored);
                
                // 2. Merge Logic
                // We use STATIC_VOCAB as the source of truth for vocabulary definitions.
                // We keep the user's SRS progress, Stats, Config, etc.
                db = {
                    ...parsed,
                    vocab: STATIC_VOCAB, // Always use static vocab
                    
                    // Ensure these fields exist (migration safety)
                    stats: { ...DEFAULT_STATS, ...parsed.stats },
                    config: { ...DEFAULT_CONFIG, ...parsed.config },
                    favorites: parsed.favorites || [],
                    favoriteGroups: parsed.favoriteGroups || [],
                    hiddenLessons: parsed.hiddenLessons || [],
                    mistakes: parsed.mistakes || [],
                    mistakeStreaks: parsed.mistakeStreaks || {},
                    srs: parsed.srs || {},
                    history: parsed.history || {},
                    studyLog: parsed.studyLog || {},
                    highScores: parsed.highScores || {
                        anki: [],
                        match: [],
                        survival: [],
                        writing: []
                    }
                };

                console.log(`[DataManager] Loaded ${STATIC_VOCAB.length} static words. Merged with user progress.`);
            } else {
                // 3. New User - Create Fresh DB
                db = {
                    vocab: STATIC_VOCAB,
                    favorites: [],
                    favoriteGroups: [],
                    hiddenLessons: [],
                    mistakes: [],
                    mistakeStreaks: {},
                    srs: {},
                    stats: DEFAULT_STATS,
                    config: DEFAULT_CONFIG,
                    history: {},
                    studyLog: {},
                    highScores: {
                        anki: [],
                        match: [],
                        survival: [],
                        writing: []
                    },
                    cramSession: undefined
                };
                console.log(`[DataManager] Created new database with ${STATIC_VOCAB.length} words.`);
            }
        } catch (e) {
            console.error("[DataManager] Error loading database:", e);
            // Fallback to safe default
            db = {
                vocab: STATIC_VOCAB,
                favorites: [],
                favoriteGroups: [],
                hiddenLessons: [],
                mistakes: [],
                mistakeStreaks: {},
                srs: {},
                stats: DEFAULT_STATS,
                config: DEFAULT_CONFIG,
                history: {},
                studyLog: {},
                highScores: { anki: [], match: [], survival: [], writing: [] },
                cramSession: undefined
            };
        }

        // Save immediately to ensure structure is consistent
        DataManager.saveDatabase(db);
        return db;
    },

    saveDatabase: (db: AppDatabase) => {
        try {
            // We can optionally exclude 'vocab' from localStorage to save space,
            // since we load it from static file anyway. 
            // BUT, if we want to support custom words later, we might need a hybrid approach.
            // For now, to strictly follow the requirement "Dữ liệu động... lưu trong localStorage",
            // we will save everything for simplicity, OR we could strip vocab.
            // 
            // However, the prompt says: "Nếu đã tồn tại -> Chỉ lấy phần srs, stats, config, favorites từ LocalStorage."
            // This implies we might not need to save vocab to LS, or if we do, we ignore it on load.
            // Let's save everything for now to avoid breaking other parts of the app that might expect full DB in LS.
            localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        } catch (e) {
            console.error("[DataManager] Error saving database:", e);
        }
    }
};
