export function normalizeCreditSnapshot(data) {
    if (!Number.isSafeInteger(data?.credits) || data.credits < 0) {
        throw new Error('The account returned an invalid credit balance.');
    }
    return {
        credits: data.credits,
        tier: data.tier?.toLowerCase() === 'pro' ? 'Pro' : 'Free'
    };
}

export function normalizeProfileSettings(raw, defaults) {
    try {
        const parsed = JSON.parse(raw || 'null');
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;
        const valid = {
            emailAlerts: typeof parsed.emailAlerts === 'boolean' ? parsed.emailAlerts : undefined,
            dataSaver: typeof parsed.dataSaver === 'boolean' ? parsed.dataSaver : undefined,
            ambientGlow: typeof parsed.ambientGlow === 'boolean' ? parsed.ambientGlow : undefined,
            defaultSteering: ['speed', 'balanced', 'accuracy'].includes(parsed.defaultSteering) ? parsed.defaultSteering : undefined,
            preferredCurrency: typeof parsed.preferredCurrency === 'string' ? parsed.preferredCurrency : undefined
        };
        const settings = { ...defaults };
        for (const [key, value] of Object.entries(valid)) {
            if (value !== undefined) settings[key] = value;
        }
        return settings;
    } catch {
        return defaults;
    }
}
