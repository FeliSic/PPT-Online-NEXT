import { WichWins } from '@/bknd/controllers/controllers'

export async function POST(req: Request) {
    return await WichWins(req)
}
