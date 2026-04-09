import { getMe } from '@/bknd/controllers/controllers' // Ajustá el path

export async function GET(req: Request) {
    return await getMe(req)
}
