import Start from "@/app/assets/START.svg"

export function StartIcon({ className }: { className?: string }) {
  return <Start className={className} />
}

// El SVG completo de la pantalla de inicio
export function HomeScreen({ onStart }: { onStart?: () => void }) {
  return (
    <svg width="320" height="568" viewBox="0 0 320 568" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fondo violeta */}
      <rect width="320" height="568" fill="#37209D"/>
      
      {/* Texto ROCK / PAPER / SCISSORS */}
      <path d="M106.706 51.0078H116.901..." fill="white"/>
      
      {/* Mano */}
      <path d="M198.004 386.14L232.601..." fill="#FFCC99"/>
      {/* resto de paths de la mano */}
      
      {/* Botón START — con onClick */}
      <g 
        onClick={onStart}
        className="cursor-pointer transition-opacity duration-300 hover:opacity-80 active:opacity-60"
        style={{ cursor: 'pointer' }}
      >
        <rect x="31" y="492" width="259" height="49" rx="10" fill="black"/>
        <path d="M142.632 519.854..." fill="white"/> {/* texto START */}
      </g>
    </svg>
  )
}