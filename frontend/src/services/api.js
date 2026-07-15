import axios from 'axios';

const API_BASE_URL = import.meta['env']?.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 180000, // Generous timeout for local reasoning workflows
});

export const apiService = {
    /**
     * Dispatches a user search query down the multi-agent pipeline orchestration layer
     * @param {string} query 
     */
    async sendChatQuery(query) {
        try {
            const response = await apiClient.post('/api/chat', { query });
            return response.data;
        } catch (error) {
            console.error('API service transaction failed:', error);

            if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
                throw new Error('Request timed out. The local reasoning model is processing deep context paths.');
            }

            const serverMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
            throw new Error(serverMessage);
        }
    }
};