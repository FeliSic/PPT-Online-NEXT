import { deleteRoom } from '@/bknd/controllers/controllers'

export async function DELETE(req: Request) {
    return deleteRoom(req)
}
