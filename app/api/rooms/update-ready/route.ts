import { NextResponse } from 'next/server'
import { Rooms } from '@/bknd/db/models'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { roomCode, player1Ready, player2Ready } = body

        const room = await Rooms.findOne({ where: { roomCode } })

        if (!room) {
            return NextResponse.json(
                { error: 'Sala no encontrada' },
                { status: 404 }
            )
        }

        // Actualizamos solo el campo que venga en el body
        const updateData: any = {}
        if (player1Ready !== undefined) updateData.player1Ready = player1Ready
        if (player2Ready !== undefined) updateData.player2Ready = player2Ready

        await room.update(updateData)

        // OPCIONAL: Si quieres que el status cambie a 'playing' automáticamente:

        if (room.player1Ready && room.player2Ready) {
            await room.update({ status: 'playing' })
        }

        return NextResponse.json({ success: true, room })
    } catch (error) {
        return NextResponse.json(
            { error: 'Error al actualizar estado' },
            { status: 500 }
        )
    }
}
