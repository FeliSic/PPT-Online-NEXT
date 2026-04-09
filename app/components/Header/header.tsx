interface HeaderProps {
  roomCode: string
  player1: string
  player2: string
}

export function Header({ roomCode, player1, player2 }: HeaderProps) {
  return (
    <header className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 text-white">
      
      {/* Jugador 1 - izquierda */}
      <div className="flex items-center gap-2 w-1/3">
        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold">
          {player1[0].toUpperCase()}
        </div>
        <span className="text-sm font-medium truncate hidden sm:block">{player1}</span>
      </div>

      {/* Código de sala - centro */}
      <div className="flex flex-col items-center w-1/3">
        <span className="text-xs text-zinc-400 uppercase tracking-widest">Sala</span>
        <span className="text-lg font-bold tracking-widest text-violet-400">{roomCode}</span>
      </div>

      {/* Jugador 2 - derecha */}
      <div className="flex items-center justify-end gap-2 w-1/3">
        <span className="text-sm font-medium truncate hidden sm:block">{player2}</span>
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold">
          {player2[0].toUpperCase()}
        </div>
      </div>

    </header>
  )
}