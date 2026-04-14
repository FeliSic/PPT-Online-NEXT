import { NextResponse } from 'next/server'
import { Rooms } from '@/bknd/db/models'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const roomCode = searchParams.get('code')

    if (!roomCode)
        return NextResponse.json({ error: 'Falta código' }, { status: 400 })

    try {
        const room = await Rooms.findOne({
            where: { roomCode },
            include: ['player1', 'player2'], // Asegúrate de que estas asociaciones existan en tu modelo
        })
        if (!room)
            return NextResponse.json(
                { error: 'Sala no encontrada' },
                { status: 404 }
            )

        return NextResponse.json(room)
    } catch (error) {
        return NextResponse.json(
            { error: 'Error al obtener estado' },
            { status: 500 }
        )
    }
}
