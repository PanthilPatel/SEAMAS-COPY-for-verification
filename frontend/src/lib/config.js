const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const configuredSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (import.meta.env.PROD) {
    const urls = [configuredApiUrl, configuredSupabaseUrl];
    if (urls.some((url) => {
        if (!url) return true;
        try {
            const parsed = new URL(url);
            return parsed.protocol !== 'https:' || /localhost|127\.0\.0\.1|\.example(\.com)?$/i.test(parsed.hostname);
        } catch {
            return true;
        }
    })) {
        throw new Error('Production API and Supabase URLs must be valid HTTPS URLs.');
    }
    if (!configuredSupabaseKey) {
        throw new Error('Production Supabase public anon key is required.');
    }
}

export const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:8000' : '');
export const SUPABASE_URL = configuredSupabaseUrl;
export const SUPABASE_ANON_KEY = configuredSupabaseKey;
