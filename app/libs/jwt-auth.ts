import jwt, { SignOptions } from 'jsonwebtoken'
import logger from './winston-logger'

const secret = process.env.JWT_SECRET

if (!secret) {
    logger.debug(`JWT_SECRET is undefined: ${secret}`)
    throw new Error('JWT_SECRET is not defined in environment variables')
}

const JWT_SECRET: string = secret

export const generateToken = (
    userId: number,
    expiresIn: string = '1h'
): string => {
    try {
        const options: SignOptions = {
            expiresIn: expiresIn as unknown as number,
        }
        const token = jwt.sign({ id: userId }, secret, options)
        logger.info(`Generated token for user ID: ${userId}`)
        logger.debug(`Token details: ${token}`)
        return token
    } catch (error: any) {
        logger.error(
            `Error generating token for user ID: ${userId} - ${error.message}`
        )
        throw error
    }
}

// export const verifyToken = (token: string) => {
//   try {
//     const validationToken = jwt.verify(token, JWT_SECRET);
//     logger.info(`Token verified successfully`);
//     logger.debug(`Token payload: ${JSON.stringify(validationToken)}`);
//     return validationToken;
//   } catch (error: any) {
//     logger.error(`Token verification failed: ${error.message}`);
//     return null;
//   }
// };

// Agrega esto a tu archivo de libs/jwt-auth.ts
export const generateOTP = (): string => {
    // Genera un número aleatorio de 6 dígitos
    return Math.floor(100000 + Math.random() * 900000).toString()
}
