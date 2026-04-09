import { getRooms } from '@/bknd/controllers/controllers'

export async function GET() {
    return getRooms()
}
