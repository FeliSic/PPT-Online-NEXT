import { EndingTheRoom } from '@/bknd/controllers/controllers'

export async function POST(req: Request) {
    return await EndingTheRoom(req)
}
