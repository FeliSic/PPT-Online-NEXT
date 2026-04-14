import logger from '@/app/libs/winston-logger'
import { AuthUserGame, Rooms, syncDatabase, User } from '../db/models'
import { Op } from 'sequelize'
import { generateOTP, generateToken } from '@/app/libs/jwt-auth'

// Users Section ------------------------------------------------------------------------------
export const RegLogUser = async (req: Request) => {
    await syncDatabase()
    const body = await req.json()
    const { name, email } = body

    // 1. Buscar o crear usuario
    let user = await User.findOne({ where: { email } })

    if (!user) {
        try {
            user = await User.create({ name, email })
            logger.info(`Nuevo usuario creado: ${name}`)
        } catch (error) {
            logger.error('Error al crear el usuario:', error)
            return new Response(
                JSON.stringify({ error: 'Error al crear el usuario' }),
                { status: 500 }
            )
        }
    }

    // 2. Verificar si ya tiene un código activo (Anti-spam)
    const existingAuth = await AuthUserGame.findOne({
        where: {
            userId: user.id,
            expiration: { [Op.gt]: new Date() },
        },
    })

    if (existingAuth) {
        return new Response(
            JSON.stringify({
                message: 'Ya tienes un código activo en tu email',
            }),
            { status: 429 }
        )
    }

    // 3. GENERAR OTP (No JWT aquí)
    const otpCode = generateOTP()

    // 4. Almacenar el código en la tabla Auth
    await AuthUserGame.create({
        userId: user.id,
        code: otpCode, // Guardamos el código de 6 dígitos
        expiration: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    })

    logger.debug(`OTP generado para ${email}: ${otpCode}`)

    // Aquí mandarías el mail con otpCode
    // await sendEmail(email, "Tu código", `Tu código es ${otpCode}`);

    return new Response(
        JSON.stringify({
            success: true,
            message: `Código enviado al email,${email},${otpCode}`,
        }),
        { status: 200 }
    )
}
// --------------------------------------------------------------------------------------------

// AuthUsers Section ------------------------------------------------------------------------------

export async function verifyAuthCodeUser(req: Request) {
    await syncDatabase()
    const { email, code } = await req.json()

    const user = await User.findOne({ where: { email } })
    if (!user)
        return new Response(
            JSON.stringify({ message: 'Usuario no encontrado' }),
            { status: 404 }
        )

    // 1. Validar el OTP contra la base de datos
    const authRecord = await AuthUserGame.findOne({
        where: {
            userId: user.id,
            code: code, // El código de 6 dígitos que viene del front
            expiration: { [Op.gt]: new Date() },
        },
    })

    if (!authRecord) {
        return new Response(
            JSON.stringify({ message: 'Código inválido o expirado' }),
            { status: 400 }
        )
    }

    // 2. Si es válido, ahora SÍ generamos el JWT REAL para la sesión
    const sessionToken = generateToken(user.id, '2h') // Token largo y seguro

    // 3. (Opcional) Borrar el código de la DB para que no se use de nuevo
    await authRecord.destroy()

    logger.info(`Usuario ${email} autenticado. Sesión iniciada.`)

    // 4. Devolvemos el JWT al frontend
    return new Response(
        JSON.stringify({
            token: sessionToken,
            userId: user.id,
            email: user.email,
        }),
        { status: 200 }
    )
}

import jwt from 'jsonwebtoken' // Importamos la librería directamente
import { NextResponse } from 'next/server'
const JSON_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura'

export async function getMe(req: Request) {
    try {
        await syncDatabase()

        const authHeader = req.headers.get('Authorization')
        const token = authHeader?.split(' ')[1]

        if (!token) {
            return new Response(
                JSON.stringify({ error: 'No token provided' }),
                { status: 401 }
            )
        }

        // 1. Verificamos el token manualmente si la lib no exporta el helper
        // jwt.verify devuelve el payload del token
        const decoded = jwt.verify(token, JSON_SECRET) as { id: number }

        if (!decoded || !decoded.id) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
            })
        }

        // 2. Buscamos al usuario en PPT_ONLINE
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'name', 'email', 'victories'],
        })

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
            })
        }

        return new Response(JSON.stringify(user), { status: 200 })
    } catch (error: any) {
        console.error('--- ERROR DETALLADO EN GETME ---')
        console.error('Mensaje:', error.message)
        console.error('Stack:', error.stack)

        // Esto te va a decir si es "jwt expired", "invalid signature" o un error de base de datos
        return new Response(
            JSON.stringify({
                error: 'Sesión inválida',
                debug: error.message,
            }),
            { status: 401 }
        )
    }
}

// --------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------

// Rooms Section ------------------------------------------------------------------------------

// bknd/controllers/rooms.ts (o donde tengas tus controladores)
// import { nanoid } from 'nanoid'; // O una función simple de random string

export async function getRooms() {
    try {
        // Traemos las salas incluyendo los datos de los jugadores
        // Ajusta los nombres de las asociaciones según tu Sequelize
        const rooms = await Rooms.findAll({
            include: [
                { association: 'player1', attributes: ['name'] },
                { association: 'player2', attributes: ['name'] },
            ],
            order: [['createdAt', 'DESC']],
        })
        return NextResponse.json(rooms)
    } catch (error) {
        return NextResponse.json(
            { error: 'Error al obtener salas' },
            { status: 500 }
        )
    }
}

export async function createRoom(req: Request) {
    try {
        await syncDatabase()

        // 1. Extraer token del header
        const authHeader = req.headers.get('Authorization')
        const token = authHeader?.split(' ')[1]
        if (!token)
            return new Response(JSON.stringify({ error: 'No autorizado' }), {
                status: 401,
            })

        // 2. Verificar quién crea la sala (ahora usamos .id que es lo que tiene tu token)
        const decoded = jwt.verify(token, JSON_SECRET) as { id: number }

        // 3. Generar código de sala único de 4 caracteres
        const roomCode = generateOTP()
        const body = await req.json()
        const { nameRoom } = body
        // 4. Crear la sala en la DB
        const newRoom = await Rooms.create({
            roomCode,
            nameRoom: nameRoom,
            player1Id: decoded.id,
            status: 'waiting',
            player2Id: null,
            player1Ready: false,
            player2Ready: false,
        })

        return new Response(JSON.stringify(newRoom), { status: 201 })
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error al crear sala' }), {
            status: 500,
        })
    }
}

export async function joinRoom(req: Request) {
    try {
        await syncDatabase()
        const { roomCode } = await req.json() // Recibimos el código por body

        const authHeader = req.headers.get('Authorization')
        const token = authHeader?.split(' ')[1]
        if (!token)
            return new Response(JSON.stringify({ error: 'No autorizado' }), {
                status: 401,
            })

        const decoded = jwt.verify(token, JSON_SECRET) as { id: number }
        const userId = decoded.id

        // Buscar la sala
        const room = await Rooms.findOne({ where: { roomCode } })

        if (!room) {
            return new Response(
                JSON.stringify({ error: 'Sala no encontrada' }),
                { status: 404 }
            )
        }

        // CASO A: Ya soy parte de la sala (Player 1 o Player 2 retomando)
        if (room.player1Id === userId || room.player2Id === userId) {
            return new Response(
                JSON.stringify({ message: 'Retomando sala', room }),
                { status: 200 }
            )
        }

        // CASO B: Unirse como Player 2 (si está vacío)
        if (!room.player2Id) {
            room.player2Id = userId
            // room.status = 'playing'; // Podrías cambiarlo aquí o esperar al botón "Iniciar"
            await room.save()
            return new Response(
                JSON.stringify({ message: 'Te has unido', room }),
                { status: 200 }
            )
        }

        // CASO C: Sala llena
        return new Response(JSON.stringify({ error: 'La sala está llena' }), {
            status: 400,
        })
        // CASO D: Ocurrio un error
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error al unirse' }), {
            status: 500,
        })
    }
}

export async function deleteRoom(req: Request) {
    try {
        await syncDatabase()

        // 1. CAMBIO AQUÍ: Extraer de la URL, no del body
        const { searchParams } = new URL(req.url)
        const roomCode = searchParams.get('roomCode')

        if (!roomCode) {
            return new Response(
                JSON.stringify({ error: 'Falta el código de sala' }),
                {
                    status: 400,
                }
            )
        }

        const authHeader = req.headers.get('Authorization')
        const token = authHeader?.split(' ')[1]
        if (!token)
            return new Response(JSON.stringify({ error: 'No autorizado' }), {
                status: 401,
            })

        const decoded = jwt.verify(token, JSON_SECRET) as { id: number }

        const room = await Rooms.findOne({ where: { roomCode } })

        if (!room) {
            return new Response(JSON.stringify({ error: 'Sala no existe' }), {
                status: 404,
            })
        }

        // Solo el player1 puede borrarla
        if (room.player1Id !== decoded.id) {
            return new Response(
                JSON.stringify({
                    error: 'No tienes permisos para borrar esta sala',
                }),
                { status: 403 }
            )
        }

        await room.destroy()

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Sala eliminada correctamente',
            }),
            { status: 200 }
        )
    } catch (error) {
        console.error('Error en deleteRoom:', error) // Útil para ver el error real en consola
        return new Response(JSON.stringify({ error: 'Error al eliminar' }), {
            status: 500,
        })
    }
}

// --------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------
// Game Section ------------------------------------------------------------------------------

// 1. api/game/plays -> Registrar jugada
export async function Plays(req: Request) {
    try {
        const { roomCode, userId, choice } = await req.json()
        const room = await Rooms.findOne({ where: { roomCode } })

        if (!room)
            return NextResponse.json(
                { error: 'Sala no encontrada' },
                { status: 404 }
            )

        // ✅ Si AMBOS choices están llenos, significa que es inicio de ronda nueva
        // Limpiar antes de escribir la nueva jugada
        if (room.p1Choice !== null && room.p2Choice !== null) {
            room.p1Choice = null
            room.p2Choice = null
        }

        if (room.player1Id === userId) room.p1Choice = choice
        else if (room.player2Id === userId) room.p2Choice = choice

        await room.save()
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Error en jugada' }, { status: 500 })
    }
}
// 2. api/game/wichWins -> Procesar resultado de la ronda y sumar puntos
// (Se llama cuando ambos jugaron)
export async function WichWins(req: Request) {
    const { roomCode } = await req.json()
    const room = await Rooms.findOne({ where: { roomCode } })

    if (!room) {
        return NextResponse.json({ bothPlayed: false })
    }

    // Ambos eligieron: devolver resultado SIN limpiar
    if (room.p1Choice && room.p2Choice) {
        return NextResponse.json({
            bothPlayed: true,
            p1Choice: room.p1Choice,
            p2Choice: room.p2Choice,
        })
    }

    // Uno o ninguno eligió todavía
    return NextResponse.json({ bothPlayed: false })
}

// 3. api/game/endingTheRoom -> Sumar victoria y destruir sala
export async function EndingTheRoom(req: Request) {
    try {
        const { roomCode, winnerId } = await req.json() // Usamos winnerId para ser claros

        // 1. Sumar victoria al User ganador (si existe)
        if (winnerId) {
            const user = await User.findByPk(winnerId)
            if (user) {
                await user.increment('victories')
                await user.reload()
            }
        }

        // 2. Borrar la sala para liberar el código
        await Rooms.destroy({ where: { roomCode } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error al cerrar sala:', error)
        return NextResponse.json(
            { error: 'Error al cerrar sala' },
            { status: 500 }
        )
    }
}

// --------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------
