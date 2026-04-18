'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { useMe } from '@/app/libs/hooks'

type Sala = {
    id: number
    roomCode: string
    nameRoom: string
    player1Id: number
    player2Id: number | null
    player1Ready: boolean
    player2Ready: boolean
    status: 'waiting' | 'playing' | 'finished'
    player1?: { name: string }
    player2?: { name: string }
}

export function HubScreen() {
    const router = useRouter()
    const { data: userData } = useMe()

    const [isDemo, setIsDemo] = useState(false)
    const [tab, setTab] = useState<'global' | 'mis-salas'>('global')
    const [isCreating, setIsCreating] = useState(false)
    const [nuevaSalaNombre, setNuevaSalaNombre] = useState('')
    const [miId, setMiId] = useState<number | null>(null)
    const [salas, setSalas] = useState<Sala[]>([])
    const [heMarcadoListo, setHeMarcadoListo] = useState<
        Record<string, boolean>
    >({})

    const fetchSalas = useCallback(async () => {
        try {
            const res = await fetch('/api/rooms')
            if (res.ok) {
                const data = await res.json()
                setSalas(data)
            }
        } catch (err) {
            console.error('Error cargando salas:', err)
        }
    }, [])

    useEffect(() => {
        const storedId = localStorage.getItem('userId')
        const storedToken = localStorage.getItem('apiToken')

        if (storedId) setMiId(parseInt(storedId))
        if (!storedToken) router.push('/')

        if (storedToken === 'demo-token') {
            setIsDemo(true)
        }

        fetchSalas()

        const interval = setInterval(fetchSalas, 4000)
        return () => clearInterval(interval)
    }, [router, fetchSalas])

    useEffect(() => {
        if (!miId) return

        const miSalaActiva = salas.find(
            (s) =>
                (s.player1Id === miId || s.player2Id === miId) &&
                s.player1Ready &&
                s.player2Ready &&
                s.status !== 'finished'
        )

        if (miSalaActiva && heMarcadoListo[miSalaActiva.roomCode]) {
            router.push(`/game/${miSalaActiva.roomCode}`)
        }
    }, [salas, miId, router, heMarcadoListo])

    // =====================
    // DEMO ROOMS (SOLO LOGICA)
    // =====================

    const CPU_SALA: Sala = {
        id: -1,
        roomCode: 'CPU-DEMO',
        nameRoom: 'VS CPU',
        player1Id: miId ?? 0,
        player2Id: 999999,
        player1Ready: false,
        player2Ready: true,
        status: 'waiting',
        player1: { name: 'Tú' },
        player2: { name: 'CPU' },
    }

    const SALA_DEMO_GLOBAL: Sala = {
        id: -2,
        roomCode: 'DEMO-ROOM',
        nameRoom: 'Sala Ejemplo',
        player1Id: 123,
        player2Id: null,
        player1Ready: false,
        player2Ready: false,
        status: 'waiting',
        player1: { name: 'JugadorX' },
    }

    // =====================
    // SALAS
    // =====================

    const salasGlobales = [
        ...(isDemo ? [SALA_DEMO_GLOBAL] : []),
        ...salas.filter(
            (s) =>
                s.player1Id !== miId &&
                s.player2Id !== miId &&
                s.status === 'waiting'
        ),
    ]

    const misSalas = [
        ...(isDemo ? [CPU_SALA] : []),
        ...salas.filter((s) => s.player1Id === miId || s.player2Id === miId),
    ]

    // =====================
    // HANDLERS
    // =====================

    const handleCrearSalaReal = async () => {
        const token = localStorage.getItem('apiToken')
        if (!nuevaSalaNombre.trim()) return

        try {
            const res = await fetch('/api/rooms/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ nameRoom: nuevaSalaNombre }),
            })

            if (res.ok) {
                setIsCreating(false)
                setNuevaSalaNombre('')
                fetchSalas()
                setTab('mis-salas')
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleUnirse = async (roomCode: string) => {
        const token = localStorage.getItem('apiToken')

        if (roomCode === 'DEMO-ROOM') return

        try {
            const res = await fetch('/api/rooms/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ roomCode }),
            })

            if (res.ok) {
                fetchSalas()
                setTab('mis-salas')
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleToggleReady = async (sala: Sala) => {
        if (isDemo && sala.roomCode === 'CPU-DEMO') {
            router.push('/game/CPU-DEMO')
            return
        }

        const esP1 = sala.player1Id === miId
        const nuevoEstado = esP1 ? !sala.player1Ready : !sala.player2Ready

        try {
            const res = await fetch('/api/rooms/update-ready', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomCode: sala.roomCode,
                    [esP1 ? 'player1Ready' : 'player2Ready']: nuevoEstado,
                }),
            })

            if (res.ok) {
                setHeMarcadoListo((prev) => ({
                    ...prev,
                    [sala.roomCode]: nuevoEstado,
                }))
                fetchSalas()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleEliminarSala = async (roomCode: string) => {
        const token = localStorage.getItem('apiToken')
        if (!confirm('¿Seguro que quieres cerrar la sala?')) return

        try {
            const res = await fetch(`/api/rooms/delete?roomCode=${roomCode}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) fetchSalas()
        } catch (err) {
            console.error(err)
        }
    }

    // =====================
    // UI (NO TOCADA)
    // =====================

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 p-4 text-white font-sans selection:bg-purple-500">
            {isCreating && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 p-8 rounded-[2rem] w-full max-w-md border border-white/10 shadow-2xl">
                        <h2 className="text-3xl font-black mb-6 italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                            NUEVA SALA
                        </h2>

                        <input
                            type="text"
                            placeholder="NOMBRE DE LA SALA..."
                            className="w-full p-5 rounded-2xl bg-black mb-6 border border-white/10 outline-none focus:border-purple-500 transition-all font-bold text-sm tracking-widest placeholder:text-gray-700"
                            value={nuevaSalaNombre}
                            onChange={(e) => setNuevaSalaNombre(e.target.value)}
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="flex-1 text-gray-500 font-black text-xs uppercase tracking-widest hover:text-white transition"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={handleCrearSalaReal}
                                className="flex-1 py-4 bg-purple-600 rounded-2xl font-black text-xs tracking-[0.2em] shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition-all"
                            >
                                CREAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div
                className="w-full max-w-3xl bg-black rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-white/5"
                style={{ height: '800px' }}
            >
                {/* TABS */}
                <div className="flex bg-gray-900/50 p-2 m-8 mb-4 rounded-3xl border border-white/5">
                    <button
                        onClick={() => setTab('global')}
                        className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all ${tab === 'global' ? 'bg-purple-600 shadow-lg shadow-purple-500/20 text-white' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                        Explorar
                    </button>
                    <button
                        onClick={() => setTab('mis-salas')}
                        className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all ${tab === 'mis-salas' ? 'bg-purple-600 shadow-lg shadow-purple-500/20 text-white' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                        Mis Partidas
                    </button>
                </div>

                <div className="flex-1 px-8 overflow-y-auto py-4 custom-scrollbar">
                    {tab === 'global' ? (
                        <div className="space-y-4">
                            <h2 className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] ml-2 mb-6">
                                Salas Disponibles
                            </h2>

                            {salasGlobales.map((sala) => (
                                <div
                                    key={sala.id}
                                    className="bg-gray-900/40 border border-white/5 rounded-[1.5rem] p-5 flex justify-between items-center hover:border-purple-500/30 transition-all group"
                                >
                                    <div>
                                        <h3 className="text-white font-black text-lg tracking-tight group-hover:text-purple-400 transition-colors uppercase italic">
                                            {sala.nameRoom}
                                        </h3>
                                        <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mt-1">
                                            Host:{' '}
                                            <span className="text-gray-300">
                                                {sala.player1?.name || 'Anon'}
                                            </span>
                                        </p>
                                    </div>

                                    <button
                                        onClick={() =>
                                            handleUnirse(sala.roomCode)
                                        }
                                        className="bg-white text-black px-8 py-3 rounded-xl font-black text-[10px] tracking-widest hover:bg-purple-500 hover:text-white transition-all transform active:scale-95"
                                    >
                                        UNIRSE
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <h2 className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] ml-2">
                                Tu Lobby Activo
                            </h2>

                            {misSalas.map((sala) => {
                                const soyP1 = sala.player1Id === miId
                                const miEstadoReady = soyP1
                                    ? sala.player1Ready
                                    : sala.player2Ready

                                const otroJugadorListo = soyP1
                                    ? sala.player2Ready
                                    : sala.player1Ready

                                return (
                                    <div
                                        key={sala.id}
                                        className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-center mb-10 relative z-10">
                                            <div className="text-center w-28">
                                                <div
                                                    className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center font-black text-2xl border-4 transition-all duration-500 ${sala.player1Ready ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] bg-blue-600' : 'border-gray-800 bg-blue-600'}`}
                                                >
                                                    {sala.player1?.name?.[0]}
                                                </div>
                                                <p className="text-white text-[11px] font-black tracking-widest uppercase truncate">
                                                    {sala.player1?.name}
                                                </p>
                                            </div>

                                            <div className="flex flex-col items-center">
                                                <span className="text-gray-800 font-black italic text-5xl tracking-tighter opacity-50">
                                                    VS
                                                </span>
                                                <span className="text-[9px] text-purple-400 font-black tracking-[0.3em] mt-2 px-4 py-1.5 bg-purple-500/10 rounded-full border border-purple-500/20 uppercase">
                                                    {sala.roomCode}
                                                </span>
                                            </div>

                                            <div className="text-center w-28">
                                                <div
                                                    className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center font-black text-2xl border-4 transition-all duration-500 ${sala.player2Ready ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] bg-red-600' : 'border-gray-800 bg-red-600'} ${!sala.player2Id && 'bg-gray-800 border-dashed border-white/10 opacity-50'}`}
                                                >
                                                    {sala.player2Id
                                                        ? sala.player2
                                                              ?.name?.[0]
                                                        : '?'}
                                                </div>
                                                <p className="text-gray-500 text-[11px] font-black tracking-widest uppercase truncate">
                                                    {sala.player2Id
                                                        ? sala.player2?.name
                                                        : 'ESPERANDO'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 relative z-10">
                                            <button
                                                onClick={() =>
                                                    handleToggleReady(sala)
                                                }
                                                disabled={!sala.player2Id}
                                                className={`w-full py-5 rounded-2xl font-black text-xs tracking-[0.3em] transition-all transform active:scale-[0.98] ${miEstadoReady ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' : 'bg-white text-black hover:bg-gray-200'} ${!sala.player2Id && 'opacity-30 cursor-not-allowed'}`}
                                            >
                                                {miEstadoReady
                                                    ? '¡LISTO PARA EL DUELO!'
                                                    : 'MARCAR LISTO'}
                                            </button>

                                            {!otroJugadorListo &&
                                                sala.player2Id && (
                                                    <p className="text-center text-purple-500 text-[9px] font-black tracking-[0.2em] animate-pulse uppercase mt-2">
                                                        Esperando confirmación
                                                        del rival...
                                                    </p>
                                                )}

                                            <button
                                                onClick={() =>
                                                    handleEliminarSala(
                                                        sala.roomCode
                                                    )
                                                }
                                                className="text-gray-600 text-[9px] font-black uppercase tracking-[0.2em] mt-4 hover:text-red-500 transition-colors"
                                            >
                                                {soyP1
                                                    ? '× Disolver Sala'
                                                    : '← Abandonar'}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="p-8 bg-black border-t border-white/5">
                    {tab === 'mis-salas' && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full py-5 rounded-2xl bg-white text-black font-black text-xs tracking-[0.3em] shadow-2xl hover:bg-purple-500 hover:text-white transition-all transform active:scale-95 uppercase"
                        >
                            + Crear Nueva Sesión
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
