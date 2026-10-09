import axios from 'axios';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/config';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000,
});

function apiError(error) {
    const detail = error?.response?.data?.detail;
    const creditDiagnostic = typeof detail === 'object'
        && ['insufficient_credits', 'credits_inconsistent'].includes(detail?.code);
    const serverMessage = typeof detail === 'string'
        ? detail
        : creditDiagnostic
            ? `${detail.message} Available: ${detail.available_credits}; required: ${detail.required_credits}; account ref: ${detail.user_ref}.`
            : detail?.message || error?.message || 'An unexpected error occurred.';
    const message = error?.response?.status
        ? `${serverMessage} (HTTP ${error.response.status})`
        : serverMessage;
    const enriched = new Error(message);
    enriched.code = typeof detail === 'object' ? detail?.code : undefined;
    enriched.status = error?.response?.status;
    enriched.details = typeof detail === 'object' ? detail : undefined;
    return enriched;
}

async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Please sign in to continue.');
    return { Authorization: `Bearer ${session.access_token}` };
}

export const apiService = {
    /**
     * Dispatches a user search query down the multi-agent pipeline orchestration layer
     * @param {string} query 
     */
    async sendChatQuery(query, steeringMode = 'balanced') {
        try {
            const response = await apiClient.post('/api/chat', { 
                query, 
                steering_mode: steeringMode 
            }, { headers: await authHeaders() });
            return response.data;
        } catch (error) {
            console.error('API service request failed:', {
                status: error?.response?.status,
                code: error?.response?.data?.detail?.code,
                user_ref: error?.response?.data?.detail?.user_ref
            });

            if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
                throw new Error('Request timed out. The local reasoning model is processing deep context paths.');
            }

            throw apiError(error);
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
            const headers = await authHeaders();
            const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ 
                    query, 
                    steering_mode: steeringMode
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const detail = errData.detail;
                const creditDiagnostic = typeof detail === 'object'
                    && ['insufficient_credits', 'credits_inconsistent'].includes(detail?.code);
                const serverMessage = typeof detail === 'string'
                    ? detail
                    : creditDiagnostic
                        ? `${detail.message} Available: ${detail.available_credits}; required: ${detail.required_credits}; account ref: ${detail.user_ref}.`
                        : detail?.message || `Server returned status ${response.status}`;
                const enriched = new Error(`${serverMessage} (HTTP ${response.status})`);
                enriched.code = typeof detail === 'object' ? detail?.code : undefined;
                enriched.status = response.status;
                enriched.details = typeof detail === 'object' ? detail : undefined;
                throw enriched;
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
                        let event;
                        try {
                            event = JSON.parse(jsonStr);
                        } catch (parseError) {
                            console.error('SSE JSON parse error:', parseError);
                            continue;
                        }
                        if (event.type === 'result') {
                            finalPayload = event.payload;
                        } else if (event.type === 'error') {
                            throw new Error(event.message || 'Product search failed. Please try again.');
                        } else if (onEvent) onEvent(event);
                    }
                }
            }
            return finalPayload;
        } catch (error) {
            console.error('Streaming request failed:', error);
            throw error;
        }
    },

    /**
     * Fetches user tier and credits
     * @param {string} userId 
     */
    async getCredits() {
        try {
            const response = await apiClient.get('/api/credits/me', { headers: await authHeaders() });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch credits:', error);
            throw error;
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
