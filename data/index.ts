import { Vocab } from '../types';
import { initialVocabData } from './initial_vocab';
import { vocabN4 } from './vocab_n4';
import { vocabN3 } from './vocab_n3';

// Mark N5 data
const n5Data = initialVocabData.map(v => ({ ...v, level: 'N5' as const }));

// Mark N4 data
const n4Data = vocabN4.map(v => ({ ...v, level: 'N4' as const }));

// Mark N3 data
const n3Data = vocabN3.map(v => ({ ...v, level: 'N3' as const }));

export const allVocabData: Vocab[] = [...n5Data, ...n4Data, ...n3Data];
