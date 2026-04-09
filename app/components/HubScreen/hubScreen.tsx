'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { useMe } from '@/app/libs/hooks'

type Sala = {
    id: number
    roomCode: string
    nombre?: string
    player1Id: number
    player2Id: number | null
    status: 'waiting' | 'playing' | 'finished'
    player1?: { name: string }
    player2?: { name: string }
}

export function HubScreen() {
    const router = useRouter()
    const { data: userData, error: authError, isLoading: loadingUser } = useMe()

    const [tab, setTab] = useState<'global' | 'mis-salas'>('global')
    const [isCreating, setIsCreating] = useState(false)
    const [nuevaSalaNombre, setNuevaSalaNombre] = useState('')
    const [miId, setMiId] = useState<number | null>(null)
    const [salas, setSalas] = useState<Sala[]>([])

    // --- 1. CARGAR SALAS DESDE LA API ---
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

        fetchSalas()
        const interval = setInterval(fetchSalas, 5000) // Polling cada 5 seg
        return () => clearInterval(interval)
    }, [router, fetchSalas])

    // --- 2. LOGICA DE ACCIONES ---
    const handleCrearSalaReal = async () => {
        // Recuperamos el token justo antes de la petición
        const token = localStorage.getItem('apiToken')
        if (!nuevaSalaNombre.trim()) return
        try {
            const res = await fetch('/api/rooms/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // <--- ESTO ES LO QUE FALTA
                },
                body: JSON.stringify({
                    nombre: nuevaSalaNombre,
                    player1Id: miId,
                }),
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
        // Recuperamos el token justo antes de la petición
        const token = localStorage.getItem('apiToken')
        try {
            const res = await fetch('/api/rooms/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // <--- ESTO ES LO QUE FALTA
                },
                body: JSON.stringify({ roomCode, player2Id: miId }),
            })
            if (res.ok) {
                fetchSalas()
                setTab('mis-salas')
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleEliminarSala = async (roomCode: string) => {
        // Recuperamos el token justo antes de la petición
        const token = localStorage.getItem('apiToken')
        if (!confirm('¿Cerrar esta sala?')) return
        try {
            const res = await fetch('/api/rooms/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // <--- ESTO ES LO QUE FALTA
                },
                body: JSON.stringify({ roomCode }),
            })
            if (res.ok) fetchSalas()
        } catch (err) {
            console.error(err)
        }
    }

    // --- 3. FILTROS ---
    const salasGlobales = salas.filter(
        (s) => s.player1Id !== miId && s.player2Id !== miId
    )
    const misSalas = salas.filter(
        (s) => s.player1Id === miId || s.player2Id === miId
    )

    if (loadingUser)
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
            </div>
        )

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 font-sans text-white">
            {/* MODAL CREACION */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 p-8 rounded-3xl w-full max-w-md border border-gray-700 shadow-2xl">
                        <h2 className="text-2xl font-black mb-6 italic">
                            NUEVA SALA
                        </h2>
                        <input
                            type="text"
                            placeholder="Ej: Duelo de Titanes"
                            className="w-full p-4 rounded-2xl bg-gray-900 text-white mb-6 border border-gray-700 focus:border-purple-500 outline-none"
                            value={nuevaSalaNombre}
                            onChange={(e) => setNuevaSalaNombre(e.target.value)}
                        />
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="flex-1 text-gray-400 font-bold hover:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCrearSalaReal}
                                className="flex-1 py-4 bg-purple-600 rounded-2xl font-black hover:bg-purple-500 shadow-lg"
                            >
                                CREAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENEDOR PRINCIPAL */}
            <div
                className="w-full max-w-3xl bg-black rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/5"
                style={{ height: '750px' }}
            >
                <div className="flex bg-gray-800/50 p-2 m-6 mb-2 rounded-2xl border border-white/5">
                    <button
                        onClick={() => setTab('global')}
                        className={`flex-1 py-3 rounded-xl text-sm font-black uppercase transition-all ${tab === 'global' ? 'bg-purple-600 shadow-lg' : 'text-gray-500'}`}
                    >
                        Explorar
                    </button>
                    <button
                        onClick={() => setTab('mis-salas')}
                        className={`flex-1 py-3 rounded-xl text-sm font-black uppercase transition-all ${tab === 'mis-salas' ? 'bg-purple-600 shadow-lg' : 'text-gray-500'}`}
                    >
                        Mis Partidas
                    </button>
                </div>

                <div className="flex-1 px-6 overflow-y-auto py-4">
                    {tab === 'global' ? (
                        <div className="space-y-4">
                            <h2 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                Salas Disponibles
                            </h2>
                            {salasGlobales.length === 0 ? (
                                <p className="text-center py-10 text-gray-600 italic">
                                    No hay salas...
                                </p>
                            ) : (
                                salasGlobales.map((sala) => (
                                    <div
                                        key={sala.id}
                                        className="bg-gray-800/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center"
                                    >
                                        <div>
                                            <h3 className="text-white font-bold text-lg">
                                                {sala.nombre || sala.roomCode}
                                            </h3>
                                            <p className="text-gray-500 text-xs">
                                                Host:{' '}
                                                {sala.player1?.name || 'Anon'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() =>
                                                handleUnirse(sala.roomCode)
                                            }
                                            className="bg-white text-black px-6 py-2 rounded-xl font-black text-xs hover:scale-105 transition"
                                        >
                                            UNIRSE
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <h2 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                Tu Lobby Activo
                            </h2>
                            {misSalas.length === 0 ? (
                                <div className="text-center py-20 text-gray-600 font-bold italic">
                                    Sin partidas activas
                                </div>
                            ) : (
                                misSalas.map((sala) => (
                                    <div
                                        key={sala.id}
                                        className="bg-gradient-to-b from-gray-800 to-gray-900 border border-purple-500/30 rounded-[2rem] p-6"
                                    >
                                        <div className="flex justify-between items-center mb-8">
                                            <div className="text-center w-24">
                                                <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center font-black text-xl border-4 border-gray-900 shadow-lg">
                                                    {sala.player1?.name?.[0] ||
                                                        'P'}
                                                </div>
                                                <p className="text-white text-xs font-bold truncate">
                                                    {sala.player1?.name}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-gray-700 font-black italic text-4xl leading-none">
                                                    VS
                                                </span>
                                                <span className="text-[10px] text-purple-400 font-bold mt-2 px-3 py-1 bg-purple-500/10 rounded-full">
                                                    {sala.roomCode}
                                                </span>
                                            </div>
                                            <div className="text-center w-24">
                                                <div
                                                    className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center font-black text-xl border-4 border-gray-900 shadow-lg ${sala.player2Id ? 'bg-red-500' : 'bg-gray-800 border-dashed border-gray-700'}`}
                                                >
                                                    {sala.player2Id
                                                        ? sala.player2
                                                              ?.name?.[0] || 'P'
                                                        : '?'}
                                                </div>
                                                <p className="text-gray-500 text-xs font-bold truncate">
                                                    {sala.player2Id
                                                        ? sala.player2?.name
                                                        : 'Esperando...'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {sala.player1Id === miId ? (
                                                <button
                                                    disabled={!sala.player2Id}
                                                    onClick={() =>
                                                        router.push(
                                                            `/game/${sala.roomCode}`
                                                        )
                                                    }
                                                    className={`w-full py-4 rounded-2xl font-black text-sm transition ${sala.player2Id ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-800 text-gray-600'}`}
                                                >
                                                    {sala.player2Id
                                                        ? 'EMPEZAR PARTIDA'
                                                        : 'ESPERANDO JUGADOR...'}
                                                </button>
                                            ) : (
                                                <div className="text-center py-4 bg-purple-500/10 rounded-2xl text-purple-400 text-xs font-bold animate-pulse">
                                                    ESPERANDO AL ADMIN...
                                                </div>
                                            )}
                                            <button
                                                onClick={() =>
                                                    handleEliminarSala(
                                                        sala.roomCode
                                                    )
                                                }
                                                className="text-red-500 text-[10px] font-black uppercase mt-2 hover:text-red-400"
                                            >
                                                {sala.player1Id === miId
                                                    ? 'Cerrar Sala'
                                                    : 'Abandonar'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gradient-to-t from-black via-black to-transparent border-t border-white/5">
                    {tab === 'mis-salas' && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full py-5 rounded-[1.5rem] bg-white text-black font-black text-sm hover:bg-gray-200 transition-transform active:scale-95 shadow-xl"
                        >
                            + CREAR NUEVA SALA
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
