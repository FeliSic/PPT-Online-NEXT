import { DataTypes, Model } from 'sequelize'
import sequelizeClient from './db'

const SCHEMA_NAME = 'PPT_ONLINE'

// --- JUGADORES (User/Owner) ---
interface UserAttributes {
    id?: number
    name: string
    email: string
    victories?: number
}

export class User extends Model<UserAttributes> implements UserAttributes {
    declare id: number
    declare name: string
    declare email: string
    declare victories?: number
}

User.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        victories: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
        sequelize: sequelizeClient,
        tableName: 'players',
        schema: SCHEMA_NAME,
    }
)

// --- AUTENTICACIÓN ---
interface AuthAttributes {
    id?: number
    userId: number
    code: string
    expiration: Date
}

export class AuthUserGame
    extends Model<AuthAttributes>
    implements AuthAttributes
{
    declare id: number
    declare userId: number
    declare code: string
    declare expiration: Date
}

AuthUserGame.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: { tableName: 'players', schema: SCHEMA_NAME },
                key: 'id',
            },
        },
        code: { type: DataTypes.STRING, allowNull: false },
        expiration: { type: DataTypes.DATE, allowNull: false },
    },
    {
        sequelize: sequelizeClient,
        tableName: 'player_auths_game',
        schema: SCHEMA_NAME,
    }
)

// --- SALAS DE JUEGO ---
interface RoomAttributes {
    id?: number
    roomCode: string
    nameRoom: string
    player1Id: number
    player2Id?: number | null
    player1Ready: boolean
    player2Ready: boolean
    p1Choice?: string | null
    p2Choice?: string | null
    status: string
    winnerId?: number | null
}

export class Rooms extends Model<RoomAttributes> implements RoomAttributes {
    declare id: number
    declare roomCode: string
    declare nameRoom: string
    declare player1Id: number
    declare player2Id: number | null
    declare player1Ready: boolean
    declare player2Ready: boolean
    declare p1Choice: string | null
    declare p2Choice: string | null
    declare status: string
    declare winnerId: number | null
}

Rooms.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nameRoom: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Nueva Sala',
        },
        roomCode: { type: DataTypes.STRING, allowNull: false, unique: true },
        player1Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: { tableName: 'players', schema: SCHEMA_NAME },
                key: 'id',
            },
        },
        player2Id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: { tableName: 'players', schema: SCHEMA_NAME },
                key: 'id',
            },
        },
        player1Ready: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        player2Ready: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        status: { type: DataTypes.STRING, defaultValue: 'waiting' },
        p1Choice: { type: DataTypes.STRING, allowNull: true },
        p2Choice: { type: DataTypes.STRING, allowNull: true },
        winnerId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: { tableName: 'players', schema: SCHEMA_NAME },
                key: 'id',
            },
        },
    },
    {
        sequelize: sequelizeClient,
        tableName: 'rooms_game',
        schema: SCHEMA_NAME,
    }
)

// --- RELACIONES ---
export function setupAssociations() {
    // Player 1 (Host)
    User.hasMany(Rooms, { foreignKey: 'player1Id', as: 'hostedRooms' })
    Rooms.belongsTo(User, { foreignKey: 'player1Id', as: 'player1' })

    // Player 2 (Invitado)
    User.hasMany(Rooms, { foreignKey: 'player2Id', as: 'joinedRooms' })
    Rooms.belongsTo(User, { foreignKey: 'player2Id', as: 'player2' })

    // Ganador
    Rooms.belongsTo(User, { foreignKey: 'winnerId', as: 'winner' })

    // Auth
    User.hasOne(AuthUserGame, { foreignKey: 'userId', as: 'auth' })
    AuthUserGame.belongsTo(User, { foreignKey: 'userId' })
}

// Ejecutar asociaciones
setupAssociations()

// --- Sincronización ---
let syncPromise: Promise<void> | null = null

export async function syncDatabase() {
    if (syncPromise) return syncPromise

    syncPromise = (async () => {
        try {
            // Importante: El esquema debe existir en Neon antes de sincronizar
            // Si no existe, Sequelize intentará crear las tablas en el esquema por defecto o fallará
            await sequelizeClient.sync()
            console.log(`✅ Tablas sincronizadas en esquema: ${SCHEMA_NAME}`)
        } catch (error) {
            console.error('❌ Error sincronizando tablas:', error)
            syncPromise = null
            throw error
        }
    })()

    return syncPromise
}
