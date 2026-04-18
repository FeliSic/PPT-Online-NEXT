'use client'

import { use, useEffect, useState } from 'react'
import { GameScreen } from '@/app/components/GameScreen/GameScreen'

interface PageProps {
    params: Promise<{ roomCode: string }>
}

export default function Page({ params }: PageProps) {
    const resolvedParams = use(params)
    const roomCode = resolvedParams.roomCode
    const isDemoMode = roomCode?.toUpperCase() === 'CPU-DEMO'
    const [roomData, setRoomData] = useState<any>(null)
    const [userId, setUserId] = useState<number | null>(null)

    const demoRoom = {
        roomCode: 'CPU-DEMO',
        player1: {
            id: userId ?? 1000,
            name: 'Demo Player',
        },
        player2: {
            id: 999999,
            name: 'CPU',
        },
    }
    const data = isDemoMode ? demoRoom : roomData
    useEffect(() => {
        const stored = localStorage.getItem('userId')
        if (stored) setUserId(Number(stored))
    }, [])

    useEffect(() => {
        if (!roomCode || isDemoMode) return

        fetch(`/api/rooms/status?code=${roomCode}`)
            .then((res) => res.json())
            .then((data) => setRoomData(data))
            .catch(console.error)
    }, [roomCode, isDemoMode])

    if (!data || userId === null) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Cargando sala...
            </div>
        )
    }

    // Asegurar que player2Name exista
    return (
        <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <GameScreen
                roomCode={roomCode}
                player1Name={data.player1?.name || 'Jugador 1'}
                player2Name={data.player2?.name || 'Esperando...'}
                currentUserId={userId}
                player1Id={data.player1?.id}
                player2Id={data.player2?.id || null}
            />
        </main>
    )
}
