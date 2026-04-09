import { RegLogUser } from '@/bknd/controllers/controllers' // Ajusta el path a tu carpeta de controllers

export async function POST(req: Request) {
    // Simplemente llamamos al controller y retornamos lo que él decida
    return await RegLogUser(req)
}
