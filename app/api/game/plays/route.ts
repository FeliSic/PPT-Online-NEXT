import { Plays } from '@/bknd/controllers/controllers'

export async function POST(req: Request) {
    // Aquí podrías validar el JWT antes de pasar al controller
    return await Plays(req)
}
