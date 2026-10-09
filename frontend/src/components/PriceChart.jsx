import React, { useState } from 'react';

export default function PriceChart({ items = [], budgetLimit = null }) {
    const [hoveredIdx, setHoveredIdx] = useState(null);

    // Filter to items with prices, sort them, and take the top 8 for readability
    const chartItems = items
        .filter(item => item.extracted_price && item.extracted_price > 0)
        .slice(0, 8);

    if (chartItems.length === 0) {
        return (
            <div className="seamas-glass border border-white/5 rounded-2xl p-6 text-center text-neutral-500 font-mono text-xs">
                Insufficient price data points to compile analytics chart.
            </div>
        );
    }

    const prices = chartItems.map(item => Number(item.extracted_price));
    const maxPrice = Math.max(...prices, budgetLimit || 0);
    
    // Nice rounded scale ceiling
    const yCeiling = Math.ceil(maxPrice * 1.15 / 1000) * 1000;

    const width = 600;
    const height = 240;
    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const getX = (index) => paddingLeft + (index * (chartWidth / chartItems.length)) + (chartWidth / chartItems.length) / 2;
    const getY = (price) => height - paddingBottom - ((price / yCeiling) * chartHeight);

    const barWidth = Math.min(32, (chartWidth / chartItems.length) * 0.5);

    return (
        <div className="seamas-glass border border-white/5 rounded-2xl p-6 text-left relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500">Price Telemetry</span>
                    <h3 className="text-sm font-bold text-white mt-0.5">Market Price & Budget Utilization</h3>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[9px] text-neutral-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Under Budget
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 ml-2"></span>
                    Over Budget
                </div>
            </div>

            <div className="relative w-full aspect-[600/240]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* SVG Filters for Glow Effects */}
                    <defs>
                        <linearGradient id="underGrad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="hsl(158 64% 52% / 0.4)" />
                            <stop offset="100%" stopColor="hsl(158 64% 52% / 0.05)" />
                        </linearGradient>
                        <linearGradient id="overGrad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="hsl(350 89% 60% / 0.4)" />
                            <stop offset="100%" stopColor="hsl(350 89% 60% / 0.05)" />
                        </linearGradient>
                    </defs>

                    {/* Y-Axis Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                        const val = yCeiling * pct;
                        const y = getY(val);
                        return (
                            <g key={idx} className="opacity-40">
                                <line 
                                    x1={paddingLeft} 
                                    y1={y} 
                                    x2={width - paddingRight} 
                                    y2={y} 
                                    stroke="rgba(255,255,255,0.06)" 
                                    strokeWidth="1"
                                />
                                <text 
                                    x={paddingLeft - 10} 
                                    y={y + 4} 
                                    fill="rgba(255,255,255,0.4)" 
                                    className="font-mono text-[9px]"
                                    textAnchor="end"
                                >
                                    ₹{Math.round(val).toLocaleString('en-IN')}
                                </text>
                            </g>
                        );
                    })}

                    {/* Bar Elements */}
                    {chartItems.map((item, idx) => {
                        const x = getX(idx);
                        const y = getY(item.extracted_price);
                        const isOver = budgetLimit && item.extracted_price > budgetLimit;
                        const barHeight = height - paddingBottom - y;
                        const isHovered = hoveredIdx === idx;

                        return (
                            <g 
                                key={idx}
                                onMouseEnter={() => setHoveredIdx(idx)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                className="cursor-pointer"
                            >
                                {/* Glow backdrop for hovered bar */}
                                {isHovered && (
                                    <rect
                                        x={x - barWidth / 2 - 4}
                                        y={y - 4}
                                        width={barWidth + 8}
                                        height={barHeight + 8}
                                        rx={8}
                                        fill={isOver ? 'hsl(350 89% 60% / 0.08)' : 'hsl(158 64% 52% / 0.08)'}
                                    />
                                )}
                                
                                {/* Bar shape */}
                                <rect
                                    x={x - barWidth / 2}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    rx={4}
                                    fill={isOver ? 'url(#overGrad)' : 'url(#underGrad)'}
                                    stroke={isOver ? 'hsl(350 89% 60% / 0.5)' : 'hsl(158 64% 52% / 0.5)'}
                                    strokeWidth={isHovered ? 2 : 1}
                                    style={{ transition: 'all 0.3s ease' }}
                                />

                                {/* Mini Dot marker at top of bar */}
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={isHovered ? 4 : 3}
                                    fill={isOver ? 'hsl(350 89% 60%)' : 'hsl(158 64% 52%)'}
                                    style={{ transition: 'all 0.2s ease' }}
                                />

                                {/* X-Axis Labels (Marketplace name + Price) */}
                                <text
                                    x={x}
                                    y={height - paddingBottom + 16}
                                    fill={isHovered ? '#fff' : 'rgba(255,255,255,0.4)'}
                                    className="font-mono text-[9px] font-bold"
                                    textAnchor="middle"
                                    style={{ transition: 'color 0.2s ease' }}
                                >
                                    {item.marketplace.split(',')[0]}
                                </text>
                                <text
                                    x={x}
                                    y={height - paddingBottom + 28}
                                    fill={isHovered ? '#fff' : 'rgba(255,255,255,0.3)'}
                                    className="font-mono text-[8px]"
                                    textAnchor="middle"
                                >
                                    ₹{Number(item.extracted_price).toLocaleString('en-IN')}
                                </text>
                            </g>
                        );
                    })}

                    {/* Glowing Budget Ceiling line */}
                    {budgetLimit && (
                        <g>
                            <line
                                x1={paddingLeft}
                                y1={getY(budgetLimit)}
                                x2={width - paddingRight}
                                y2={getY(budgetLimit)}
                                stroke="hsl(350 89% 60%)"
                                strokeDasharray="4 4"
                                strokeWidth="1.5"
                                className="drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                            />
                            <text
                                x={width - paddingRight}
                                y={getY(budgetLimit) - 6}
                                fill="hsl(350 89% 60%)"
                                className="font-mono text-[8px] font-bold uppercase tracking-wider"
                                textAnchor="end"
                            >
                                Budget Limit: ₹{budgetLimit.toLocaleString('en-IN')}
                            </text>
                        </g>
                    )}
                </svg>

                {/* Tooltip Overlay */}
                {hoveredIdx !== null && (
                    <div 
                        className="absolute z-20 seamas-glass-strong border border-white/10 px-3 py-2.5 rounded-xl text-xs text-left max-w-[240px] pointer-events-none shadow-xl animate-fade-in"
                        style={{
                            left: `${Math.min(80, Math.max(10, (getX(hoveredIdx) / width) * 100))}%`,
                            top: `${Math.max(5, (getY(chartItems[hoveredIdx].extracted_price) / height) * 100 - 32)}%`,
                            transform: 'translate(-50%, -100%)',
                        }}
                    >
                        <div className="font-bold text-white line-clamp-1">{chartItems[hoveredIdx].product_name}</div>
                        <div className="flex items-center justify-between gap-4 mt-1 font-mono text-[10px]">
                            <span className="text-neutral-400">{chartItems[hoveredIdx].marketplace}</span>
                            <span className={budgetLimit && chartItems[hoveredIdx].extracted_price > budgetLimit ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                                ₹{Number(chartItems[hoveredIdx].extracted_price).toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
