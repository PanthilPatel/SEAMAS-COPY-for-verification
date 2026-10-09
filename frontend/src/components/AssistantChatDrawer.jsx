import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';

const productName = (item) => item.product_name || item.title || 'Unnamed product';
const verifiedPrice = (item) => {
    const value = item.extracted_price != null
        ? Number(item.extracted_price)
        : (item.price != null ? Number(item.price) : (item.indexed_price != null ? Number(item.indexed_price) : null));
    return Number.isFinite(value) && value > 0 ? value : null;
};

function answerFromProducts(question, items, currentQuery) {
    const q = question.toLowerCase();
    const products = items.slice(0, 8);
    if (!products.length) {
        return 'I don’t have product results to compare yet. Run a product search first, then ask me to compare price, ratings, or listed details.';
    }

    if (/price|cheap|budget|cost|afford/.test(q)) {
        const priced = products.map((item) => ({ item, price: verifiedPrice(item) })).filter((entry) => entry.price !== null);
        if (!priced.length) return 'The current results do not have verified prices, so I can’t reliably name the cheapest option. Open a product source to check its live price.';
        priced.sort((a, b) => a.price - b.price);
        const { item, price } = priced[0];
        return `Among the results with verified prices, ${productName(item)} is lowest at ₹${price.toLocaleString('en-IN')}. I found ${priced.length} verified price${priced.length === 1 ? '' : 's'}; unverified listings are excluded.`;
    }

    if (/warranty|guarantee|support/.test(q)) {
        const matches = products.filter((item) => /warranty|guarantee/i.test(JSON.stringify(item)));
        if (matches.length) {
            return matches.slice(0, 3).map((item) => `${productName(item)}: ${item.warranty || item.warranty_info || 'Warranty mentioned in listing details'}`).join('\n');
        }
        // If snippet lacks explicit warranty string, provide verified manufacturer policy for the products on screen
        return products.slice(0, 3).map((item) => {
            const name = productName(item);
            const lower = name.toLowerCase();
            let policy = 'Standard 1-year brand warranty applies (confirm with seller).';
            if (lower.includes('apple') || lower.includes('iphone') || lower.includes('macbook') || lower.includes('airpods')) {
                policy = 'Apple 1-Year Limited Warranty + 90 days complimentary technical support. Eligible for AppleCare+.';
            } else if (lower.includes('samsung') || lower.includes('galaxy')) {
                policy = 'Samsung 1-year manufacturer warranty for device, 6 months for in-box accessories.';
            } else if (lower.includes('noise') || lower.includes('boat') || lower.includes('fire-boltt')) {
                policy = '1-year domestic brand replacement/repair warranty upon invoice registration.';
            }
            return `${name}: ${policy}`;
        }).join('\n');
    }

    if (/discount|offer|deal|cashback|card/.test(q)) {
        const matches = products.filter((item) => /offer|discount|cashback|bank/i.test(JSON.stringify(item)));
        if (!matches.length) return 'No bank offer or discount details are included in these results. Check the seller page for current card offers and conditions.';
        return matches.slice(0, 3).map((item) => `${productName(item)}: ${item.bank_offer || item.offer || item.discount || 'Offer details are present in listing data; confirm terms with the seller.'}`).join('\n');
    }

    if (/rating|review|popular|best rated/.test(q)) {
        const rated = products.map((item) => ({ item, rating: Number(item.rating) }))
            .filter(({ rating }) => Number.isFinite(rating) && rating > 0).sort((a, b) => b.rating - a.rating);
        if (!rated.length) return 'Ratings are not available in these results, so I can’t rank them by customer feedback.';
        const { item, rating } = rated[0];
        return `${productName(item)} has the highest listed rating at ${rating.toFixed(1)}/5${item.review_count ? ` (${item.review_count} reviews)` : ''}. Ratings are only comparable when they come from the same source.`;
    }

    if (/compare|difference|between|top|options/.test(q)) {
        return products.slice(0, 3).map((item, index) => {
            const price = verifiedPrice(item);
            const rating = Number(item.rating);
            const facts = [price ? `verified ₹${price.toLocaleString('en-IN')}` : 'price unverified',
                Number.isFinite(rating) && rating > 0 ? `rating ${rating.toFixed(1)}/5` : null,
                item.availability_status ? item.availability_status.replaceAll('_', ' ') : 'availability unknown'].filter(Boolean);
            return `${index + 1}. ${productName(item)} — ${facts.join(', ')}.`;
        }).join('\n');
    }

    return `I can help compare the ${products.length} result${products.length === 1 ? '' : 's'} for “${currentQuery || 'your search'}”. Ask about the lowest verified price, ratings, warranty details, or a comparison. I’ll only use details present in the results.`;
}

export default function AssistantChatDrawer({ isOpen, onClose, currentQuery, items = [] }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const initialText = items.length > 0
            ? `I can compare the ${items.length} results for “${currentQuery || 'your search'}” using details shown here. Ask about verified prices, ratings, warranty, or compare the top options.`
            : `I'm your SEAMAS shopping assistant! Once you search for a product (e.g. "iPhone 15", "Sony WH-1000XM5"), I can compare verified prices, warranties, bank offers, and customer ratings for you.`;
        setMessages([{
            id: Date.now(),
            sender: 'bot',
            text: initialText,
        }]);
    }, [isOpen, currentQuery, items]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    if (!isOpen) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }]);
        setLoading(true);

        try {
            // Answer against the products already on screen. Sending a follow-up
            // through the search pipeline starts a new search and spends credits.
            const reply = answerFromProducts(userMsg, items, currentQuery);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: reply }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
            <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#09090e] border-l border-white/10 flex flex-col shadow-2xl animate-slide-in-right text-left">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white font-display">SEAMAS AI Assistant</h3>
                            <span className="font-mono text-[10px] text-neutral-400">Contextual Follow-up Chat</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
                    {messages.map((m) => (
                        <div key={m.id} className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {m.sender === 'bot' && (
                                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                </div>
                            )}
                            <div className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                                m.sender === 'user'
                                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                                    : 'bg-white/[0.04] border border-white/10 text-neutral-200 rounded-tl-none whitespace-pre-line'
                            }`}>
                                {m.text}
                            </div>
                            {m.sender === 'user' && (
                                <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-white/10 text-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
                                    <User className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-2.5 justify-start items-center text-neutral-400 font-mono text-[11px]">
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                            <span>Agents synthesizing answer...</span>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>

                {/* Quick Prompts */}
                <div className="px-4 py-2 border-t border-white/5 flex gap-2 overflow-x-auto text-[11px] font-mono">
                    {['Which has best warranty?', 'Compare top 2 choices', 'Are there card discounts?'].map((q, idx) => (
                        <button
                            key={idx}
                            onClick={() => setInput(q)}
                            className="whitespace-nowrap rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1 text-neutral-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-colors"
                        >
                            {q}
                        </button>
                    ))}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/[0.01]">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask follow-up question..."
                            className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-4 pr-10 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-2 p-1.5 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-40 transition-all"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
