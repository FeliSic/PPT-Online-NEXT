'use client'
import { useState } from 'react'
import { sendAuthEmail, getToken } from '@/app/libs/apiFetcher'

export default function LogIn() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [step, setStep] = useState(1)
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault()
        if (step === 1) setStep(2)
        else if (step === 2 && termsAccepted) setStep(3)
    }

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const result = await sendAuthEmail(name, email)
        setLoading(false)
        if (result.success) {
            setStep(4)
        } else {
            alert('Error: ' + (result.error || 'No se pudo enviar el email'))
        }
    }

    const handleTokenSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const result = await getToken(email, code)
        setLoading(false)
        if (result.success) {
            // Guardamos en localStorage
            localStorage.setItem('apiToken', result.token || '')
            localStorage.setItem('userEmail', result.email || '')
            localStorage.setItem('userName', name) // Guardamos el nombre también
            localStorage.setItem('userId', result.userId?.toString() || '')

            window.location.href = '/home'
        } else {
            alert('Código incorrecto: ' + result.error)
        }
    }
    const handleDemoLogin = () => {
        localStorage.setItem('apiToken', 'demo-token')
        localStorage.setItem('userEmail', 'demo@demo.com')
        localStorage.setItem('userName', 'Demo Player')
        localStorage.setItem('userId', '1000')

        window.location.href = '/home'
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 font-sans text-white">
            <div className="w-full max-w-md bg-black border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
                {/* Indicador de pasos */}
                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`h-1 w-8 rounded-full transition-colors ${step >= s ? 'bg-green-500' : 'bg-gray-800'}`}
                        />
                    ))}
                </div>

                <form
                    onSubmit={
                        step === 4
                            ? handleTokenSubmit
                            : step === 3
                              ? handleEmailSubmit
                              : handleNextStep
                    }
                    className="space-y-6"
                >
                    {step === 1 && (
                        <div className="text-center space-y-4">
                            <h1 className="text-3xl font-black italic tracking-tighter">
                                PPT ONLINE
                            </h1>
                            <p className="text-gray-400 text-sm">
                                El clásico Piedra, Papel o Tijera, ahora
                                competitivo y en tiempo real.
                            </p>
                            <button
                                type="submit"
                                className="w-full py-4 bg-purple-600 rounded-2xl font-bold hover:bg-purple-500 transition shadow-lg shadow-purple-900/20"
                            >
                                EMPEZAR
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">
                                Términos del Servicio
                            </h2>
                            <div className="bg-gray-900 p-4 rounded-xl h-32 overflow-y-auto text-xs text-gray-500 border border-white/5">
                                Al usar esta plataforma, aceptas que esto es un
                                juego de demostración... (rellenar con
                                legalidades).
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) =>
                                        setTermsAccepted(e.target.checked)
                                    }
                                    className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm text-gray-300 group-hover:text-white transition">
                                    Acepto los términos y condiciones
                                </span>
                            </label>
                            <button
                                disabled={!termsAccepted}
                                className={`w-full py-4 rounded-2xl font-bold transition ${termsAccepted ? 'bg-purple-600 hover:bg-purple-500 shadow-lg' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                            >
                                CONTINUAR
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Tus Datos</h2>
                            <input
                                type="text"
                                placeholder="Nombre de jugador"
                                className="w-full p-4 rounded-2xl bg-gray-900 border border-gray-700 focus:border-green-500 outline-none transition-all"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full p-4 rounded-2xl bg-gray-900 border border-gray-700 focus:border-green-500 outline-none transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-green-600 rounded-2xl font-bold hover:bg-green-500 transition"
                            >
                                {loading ? 'ENVIANDO...' : 'RECIBIR CÓDIGO'}
                            </button>
                            <button
                                type="button"
                                onClick={handleDemoLogin}
                                className="w-full mt-3 py-4 bg-gray-800 rounded-2xl font-bold hover:bg-gray-700 transition"
                            >
                                PROBAR DEMO
                            </button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4 text-center">
                            <h2 className="text-xl font-bold text-green-500">
                                Verifica tu Email
                            </h2>
                            <p className="text-gray-400 text-sm">
                                Hemos enviado un código a <br />
                                <span className="text-white font-mono">
                                    {email}
                                </span>
                            </p>
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                className="w-full p-4 text-center text-2xl tracking-[1rem] font-mono rounded-2xl bg-gray-900 border border-gray-700 focus:border-green-500 outline-none transition-all"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition"
                            >
                                {loading
                                    ? 'VERIFICANDO...'
                                    : 'INGRESAR AL LOBBY'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}
