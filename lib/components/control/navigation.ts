import { useEffect } from "react"

export const NavigateToSignin = () => {
    useEffect(() => {
        window.history.pushState({}, '', '/sign-in')
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }, [])

    return null
}

export const NavigateToSignup = () => {
    useEffect(() => {
        window.history.pushState({}, '', '/sign-up')
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }, [])

    return null
}