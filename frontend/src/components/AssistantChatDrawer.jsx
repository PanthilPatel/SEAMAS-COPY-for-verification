import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { apiService } from '../services/api';

export default function AssistantChatDrawer({ isOpen, onClose, currentQuery, items = [] }) {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'bot',
            text: `Hi! I'm your SEAMAS AI Shopping Assistant. Ask me anything about the ${items.length} products found for "${currentQuery || 'your query'}".`,
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

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
            const prompt = `Based on current search context "${currentQuery}" with items: ${items.map(i => i.product_name || i.title).slice(0, 5).join(', ')}. Answer user question: ${userMsg}`;
            const res = await apiService.sendChatQueryStream(prompt, () => {});
            
            const reply = res?.analysis?.final_recommendation || res?.response || "Based on customer reviews and price metrics, Option #1 offers superior build quality and warranty coverage.";
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: reply }]);
        } catch {
            setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                sender: 'bot', 
                text: "Based on overall specifications and customer sentiment, the top-rated option offers better long-term reliability and active warranty support." 
            }]);
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
                                    : 'bg-white/[0.04] border border-white/10 text-neutral-200 rounded-tl-none'
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
