
import { loadDB } from './storageService';

export const playSfx = (freq: number, type: OscillatorType, duration: number) => {
    try {
        const db = loadDB();
        if (db.config.soundEnabled === false) return;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        
        const audioCtx = new AudioContextClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.error("SFX Error", e);
    }
};

export const getAvailableVoices = (langPrefix: string): SpeechSynthesisVoice[] => {
    if (!('speechSynthesis' in window)) return [];
    const voices = window.speechSynthesis.getVoices();
    return voices.filter(v => v.lang.startsWith(langPrefix));
};

export const speakText = (text: string, lang: 'ja-JP' | 'vi-VN' = 'ja-JP') => {
    try {
        const db = loadDB();
        if (db.config.soundEnabled === false) return;

        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        
        const voices = window.speechSynthesis.getVoices();
        let voice: SpeechSynthesisVoice | undefined;

        // 1. Check User Preference
        const preferredURI = lang === 'ja-JP' ? db.config.voiceURI_ja : db.config.voiceURI_vi;
        if (preferredURI) {
            voice = voices.find(v => v.voiceURI === preferredURI);
        }

        // 2. Smart Fallback if no preference or preference not found
        if (!voice) {
            if (lang === 'vi-VN') {
                // Prioritize known good Vietnamese voices
                // "Google Tiếng Việt" (Android/Chrome), "Microsoft An" (Windows), "Linh" (iOS)
                voice = voices.find(v => v.lang === 'vi-VN' && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Linh'))) 
                     || voices.find(v => v.lang === 'vi-VN');
            } else {
                // Japanese Fallback
                voice = voices.find(v => v.lang === lang) || 
                        voices.find(v => v.lang.startsWith(lang.split('-')[0]));
            }
        }
        
        if (voice) {
            utterance.voice = voice;
        }

        utterance.rate = 1;
        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.error("TTS Error", e);
    }
};
