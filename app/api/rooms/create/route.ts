import { createRoom } from '@/bknd/controllers/controllers'

export async function POST(req: Request) {
    return createRoom(req)
}
