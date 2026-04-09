export async function fetchAPI(
    endpoint: string,
    requiresAuth: boolean = true
): Promise<any> {
    const headers: HeadersInit = {}

    if (requiresAuth) {
        const token = localStorage.getItem('apiToken')
        console.log('Token en fetchAPI:', token)
        if (!token) {
            return Promise.reject(new Error('API token is missing'))
        }
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(endpoint, {
        headers,
    })

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
            `Error ${response.status}: ${errorData.message || 'Network response was not ok'}`
        )
    }

    return response.json()
}

// User Fetchings -----------------------------------------------------------------------------------------------------------------------------------------------------------

export function sendAuthEmail(
    name: string,
    email: string
): Promise<{ success: boolean; error?: string }> {
    return fetch('/api/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                return { success: data.success, ...data } // Asegúrate de que el backend devuelva un objeto con success
            } else {
                return { success: false, error: data.error }
            }
        })
}

export function getToken(
    email: string,
    code: string
): Promise<{
    success: boolean
    token?: string
    email?: string
    userId?: number
    error?: string
}> {
    return fetch('/api/users/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.token) {
                localStorage.setItem('apiToken', data.token)
                return {
                    success: true,
                    token: data.token,
                    email: data.email,
                    userId: data.userId,
                }
            } else {
                return {
                    success: false,
                    error: data.error || 'Authentication failed',
                }
            }
        })
}
// -----------------------------------------------------------------------------------------------------------------------------------------------------------

// Products Fetchings -----------------------------------------------------------------------------------------------------------------------------------------------------------

const searchProducts = (query: string): Promise<any> => {
    return fetch(
        `/api/search/search/search?query=${encodeURIComponent(query)}`
    ).then((response) => {
        if (response.ok) {
            return response.json()
        } else {
            throw new Error('Network response was not ok')
        }
    })
}
