'use client'

import { use, useEffect, useState } from 'react'
import { GameScreen } from '@/app/components/GameScreen/GameScreen'

interface PageProps {
    params: Promise<{ roomCode: string }>
}

export default function Page({ params }: PageProps) {
    const resolvedParams = use(params)
    const roomCode = resolvedParams.roomCode
    const [roomData, setRoomData] = useState<any>(null)
    const [userId, setUserId] = useState<number | null>(null)

    useEffect(() => {
        const stored = localStorage.getItem('userId')
        if (stored) setUserId(Number(stored))
    }, [])

    useEffect(() => {
        if (!roomCode) return
        fetch(`/api/rooms/status?code=${roomCode}`)
            .then((res) => res.json())
            .then((data) => setRoomData(data))
            .catch(console.error)
    }, [roomCode])

    if (!roomData || userId === null) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Cargando sala...
            </div>
        )
    }

    // Asegurar que player2Name exista
    const player2Name = roomData.player2?.name || 'Esperando...'
    const player2Id = roomData.player2?.id || null

    return (
        <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <GameScreen
                roomCode={roomCode}
                player1Name={roomData.player1.name}
                player2Name={player2Name}
                currentUserId={userId}
                player1Id={roomData.player1.id}
                player2Id={player2Id}
            />
        </main>
    )
}
