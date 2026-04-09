import { joinRoom } from '@/bknd/controllers/controllers'

export async function POST(req: Request) {
    return joinRoom(req)
}
