import { Vocab } from '../types';

export const fetchMasterData = async (): Promise<Vocab[]> => {
    try {
        const response = await fetch('/api/master-data');
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch master data", error);
        return [];
    }
};

export const saveMasterData = async (data: Vocab[]): Promise<boolean> => {
    try {
        const response = await fetch('/api/master-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.ok;
    } catch (error) {
        console.error("Failed to save master data", error);
        return false;
    }
};
