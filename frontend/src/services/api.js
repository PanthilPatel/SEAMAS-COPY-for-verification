import axios from 'axios';

const API_BASE_URL = import.meta['env']?.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 600000, // Generous timeout for local reasoning workflows (10 mins)
});

export const apiService = {
    /**
     * Dispatches a user search query down the multi-agent pipeline orchestration layer
     * @param {string} query 
     */
    async sendChatQuery(query, steeringMode = 'balanced') {
        try {
            const session = JSON.parse(localStorage.getItem('seamas_user_session') || '{}');
            const response = await apiClient.post('/api/chat', { 
                query, 
                user_id: session.id,
                steering_mode: steeringMode 
            });
            return response.data;
        } catch (error) {
            console.error('API service transaction failed:', error);

            if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
                throw new Error('Request timed out. The local reasoning model is processing deep context paths.');
            }

            const serverMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
            throw new Error(serverMessage);
        }
    },

    /**
     * Dispatches a user search query via streaming SSE to receive real-time agent node updates
     * @param {string} query 
     * @param {string} steeringMode
     * @param {function} onEvent 
     */
    async sendChatQueryStream(query, steeringMode = 'balanced', onEvent) {
        try {
            const session = JSON.parse(localStorage.getItem('seamas_user_session') || '{}');
            const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query, 
                    user_id: session.id,
                    steering_mode: steeringMode
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Server returned status ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let finalPayload = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data:')) {
                        const jsonStr = trimmed.replace(/^data:\s*/, '');
                        try {
                            const event = JSON.parse(jsonStr);
                            if (event.type === 'result') {
                                finalPayload = event.payload;
                            } else if (event.type === 'error') {
                                throw new Error(event.message);
                            } else {
                                if (onEvent) onEvent(event);
                            }
                        } catch (e) {
                            if (e.message && e.message !== 'Unexpected end of JSON input') {
                                console.error('SSE JSON parse error:', e);
                            }
                        }
                    }
                }
            }
            return finalPayload;
        } catch (error) {
            console.warn('Streaming failed, falling back to standard chat endpoint:', error);
            return await this.sendChatQuery(query);
        }
    },

    /**
     * Checks the health and status of the API, Database, and Agents
     */
    async checkSystemStatus() {
        try {
            const response = await apiClient.get('/api/status', { timeout: 3000 });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch system status:', error);
            return {
                api: 'down',
                database: 'down',
                agents: 'down'
            };
        }
    }
};