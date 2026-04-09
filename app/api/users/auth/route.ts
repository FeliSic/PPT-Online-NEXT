import { verifyAuthCodeUser } from '@/bknd/controllers/controllers'

export async function POST(req: Request) {
    // Delegamos la validación y generación de JWT al controller
    return await verifyAuthCodeUser(req)
}
