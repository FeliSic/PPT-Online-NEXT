'use client'
import { HubScreen } from '../components/HubScreen/hubScreen'

export default function HubPage() {
    const handleBack = () => {
        window.history.back() // o usar router.push('/')
    }

    const handleCreateSala = () => {
        // Abrir modal o redirigir a creación
        alert('Abrir formulario de creación')
    }

    const handleJoinSala = (salaId: string) => {
        // Lógica para unirse a la sala
        alert(`Unirse a sala ${salaId}`)
    }

    return <HubScreen />
}
