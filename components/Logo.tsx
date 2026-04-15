import React from 'react';

interface LogoProps {
    className?: string;
    compact?: boolean;
    showTagline?: boolean;
}

/** Circular brand mark - used as favicon / nav icon */
export const LogoMark: React.FC<{ className?: string }> = ({ className = 'h-9 w-9' }) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Liora">
        <circle cx="40" cy="40" r="40" fill="#1A4D2E"/>
        <circle cx="40" cy="40" r="34" fill="none" stroke="#C8891A" strokeWidth="1.5" opacity="0.45"/>
        <path d="M22 18 Q40 10 58 18" fill="none" stroke="#C8891A" strokeWidth="2" strokeLinecap="round" opacity="0.65"/>
        <text
            x="38" y="57"
            textAnchor="middle"
            fontFamily="Georgia,'Times New Roman',serif"
            fontWeight="700"
            fontSize="44"
            fill="white"
        >L</text>
        <circle cx="56" cy="53" r="4" fill="#C8891A"/>
    </svg>
);

export const Logo: React.FC<LogoProps> = ({ className = 'h-12', compact = false, showTagline = false }) => {
    if (compact) return <LogoMark className={className} />;

    return (
        <svg
            viewBox={showTagline ? '0 0 580 210' : '0 0 580 185'}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Liora - Culinary Excellence, Elevated"
        >
            <defs>
                <linearGradient id="goldSheen" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4A827"/>
                    <stop offset="60%" stopColor="#C8891A"/>
                    <stop offset="100%" stopColor="#B87010"/>
                </linearGradient>
            </defs>

            {/* Chef hat puffs */}
            <circle cx="72"  cy="16" r="13" fill="rgba(200,137,26,0.10)" stroke="#C8891A" strokeWidth="2"/>
            <circle cx="88"  cy="9"  r="16" fill="rgba(200,137,26,0.10)" stroke="#C8891A" strokeWidth="2"/>
            <circle cx="104" cy="16" r="13" fill="rgba(200,137,26,0.10)" stroke="#C8891A" strokeWidth="2"/>
            <rect x="60" y="26" width="58" height="10" rx="2.5" fill="#C8891A"/>
            <path d="M88 13 C88 13 84 9 84 7 A3.2 3.2 0 0 1 88 5.5 A3.2 3.2 0 0 1 92 7 C92 9 88 13 88 13Z" fill="#C8891A"/>

            {/* Fork */}
            {[22,28,34,40].map((x, i) => <rect key={i} x={x} y="40" width="3.5" height="42" rx="1.7" fill="#C8891A"/>)}
            <path d="M22 82 Q22 95 31 99 Q40 95 40 82" fill="#C8891A"/>
            <rect x="28" y="99" width="8" height="68" rx="4" fill="#C8891A"/>

            {/* L body */}
            <rect x="60" y="36" width="24" height="106" rx="3.5" fill="#1A4D2E"/>
            <rect x="86" y="36" width="6" height="106" rx="2.5" fill="#C8891A"/>
            <rect x="95" y="36" width="24" height="106" rx="3.5" fill="#1A4D2E"/>
            <rect x="60" y="144" width="94" height="20" rx="3.5" fill="#1A4D2E"/>
            <rect x="60" y="166" width="94" height="5.5" rx="2" fill="#C8891A"/>

            {/* AI chip */}
            <rect x="66" y="82" width="38" height="38" rx="5" fill="#1A4D2E" stroke="#C8891A" strokeWidth="2.5"/>
            {[89,96,103].map((y, i) => <rect key={i} x="58" y={y} width="8" height="3.5" rx="1.5" fill="#C8891A"/>)}
            {[89,96,103].map((y, i) => <rect key={i} x="104" y={y} width="8" height="3.5" rx="1.5" fill="#C8891A"/>)}
            {[70,78,86].map((x, i) => <rect key={i} x={x} y="74" width="3.5" height="8" rx="1.5" fill="#C8891A"/>)}
            {[70,78,86].map((x, i) => <rect key={i} x={x} y="120" width="3.5" height="8" rx="1.5" fill="#C8891A"/>)}
            <text x="85" y="106" textAnchor="middle" fontFamily="'Arial','Helvetica',sans-serif" fontWeight="900" fontSize="16" fill="#C8891A">AI</text>

            {/* Spoon */}
            <ellipse cx="136" cy="64" rx="11" ry="15" fill="#C8891A"/>
            <rect x="131" y="79" width="10" height="88" rx="5" fill="#C8891A"/>

            {/* Circuit hand */}
            <path d="M42 170 Q90 162 152 167" fill="none" stroke="#1A4D2E" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M42 170 Q36 182 46 188 Q92 198 148 194 Q162 191 162 180 Q159 168 152 167" fill="none" stroke="#1A4D2E" strokeWidth="2.5"/>
            {[[58,170,56,158],[75,168,73,155],[95,167,93,154],[115,168,113,156]].map(([x1,y1,x2,y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C8891A" strokeWidth="2" strokeLinecap="round"/>
            ))}
            {[[56,158],[73,155],[93,154],[113,156]].map(([cx,cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="4" fill="#C8891A"/>
            ))}
            <path d="M46 188 Q92 198 148 194" fill="none" stroke="#C8891A" strokeWidth="2" strokeLinecap="round"/>

            {/* LIORA text */}
            <text
                x="190" y="148"
                fontFamily="'Cormorant Garamond','Georgia','Times New Roman',serif"
                fontSize="135" fontWeight="700" fill="#1A4D2E"
                letterSpacing="-2"
            >LIORA</text>

            {showTagline && (
                <text
                    x="193" y="178"
                    fontFamily="'Cormorant Garamond','Georgia','Times New Roman',serif"
                    fontSize="20" fontWeight="600" fill="#C8891A"
                    letterSpacing="3"
                >CULINARY EXCELLENCE, ELEVATED</text>
            )}
        </svg>
    );
};

export default Logo;