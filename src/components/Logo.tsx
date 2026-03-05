export function Logo() {
  return (
    <span className="inline-flex items-center font-mono font-bold text-xl tracking-tight select-none" style={{ width: 110 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40" fill="none">
        <text
          x="4"
          y="30"
          fontFamily="ui-monospace, 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace"
          fontWeight="700"
          fontSize="28"
          letterSpacing="-0.5"
          fill="currentColor"
        >
          andr<tspan fill="#89937C">³</tspan>s
        </text>
        <rect x="115" y="6" width="2.5" height="26" rx="1" fill="currentColor" opacity="0.65">
          <animate attributeName="opacity" values="0.65;0;0.65" dur="1.2s" repeatCount="indefinite"/>
        </rect>
      </svg>
    </span>
  );
}
