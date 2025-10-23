export interface TellerEnrollment {
    accessToken: string;
    enrollmentId?: string;
    institution?: string;
    [key: string]: unknown;
}

export interface TellerConnectOptions {
    onSuccess: (enrollment: TellerEnrollment) => void | Promise<void>;
    onExit?: () => void;
    onFailure?: (error: Error) => void;
}

interface TellerConnectInstance {
    open: () => void;
}

interface TellerConnectFactory {
    (options: TellerConnectConfiguration): TellerConnectInstance;
}

interface TellerConnectConfiguration {
    applicationId: string;
    environment?: string;
    products?: string[];
    institution?: string;
    onSuccess: (enrollment: TellerEnrollment) => void | Promise<void>;
    onExit?: () => void;
    onFailure?: (error: Error) => void;
}

const CONNECT_SCRIPT_SRC = 'https://cdn.teller.io/connect/connect.js';

const tellerApplicationId = (import.meta.env.VITE_TELLER_APPLICATION_ID || '').trim();
const tellerEnvironment = (import.meta.env.VITE_TELLER_ENVIRONMENT || '').trim();
const tellerProductsRaw = (import.meta.env.VITE_TELLER_PRODUCTS || '').trim();
const tellerInstitution = (import.meta.env.VITE_TELLER_INSTITUTION || '').trim();

const tellerProducts = tellerProductsRaw
    ? tellerProductsRaw.split(',').map(product => product.trim()).filter(Boolean)
    : undefined;

let connectScriptPromise: Promise<boolean> | null = null;

export const isTellerConfigured = (): boolean => Boolean(tellerApplicationId);

async function loadScript(): Promise<boolean> {
    if (!isTellerConfigured()) {
        throw new Error('Teller Connect is not configured. Set VITE_TELLER_APPLICATION_ID.');
    }

    if (typeof window !== 'undefined' && resolveFactory()) {
        return true;
    }

    if (connectScriptPromise) {
        return connectScriptPromise;
    }

    connectScriptPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            resolve(false);
            return;
        }

        const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${CONNECT_SCRIPT_SRC}"]`);
        if (existingScript) {
            if (existingScript.dataset && existingScript.dataset.tellerReady === 'true') {
                resolve(true);
                return;
            }
            existingScript.addEventListener('load', () => resolve(true), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Failed to load Teller Connect script.')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = CONNECT_SCRIPT_SRC;
        script.async = true;
        script.onload = () => {
            if (script.dataset) {
                script.dataset.tellerReady = 'true';
            }
            resolve(true);
        };
        script.onerror = () => reject(new Error('Failed to load Teller Connect script.'));
        document.head.appendChild(script);
    });

    return connectScriptPromise;
}

function resolveFactory(): TellerConnectFactory | null {
    if (typeof window === 'undefined') return null;

    try {
        if (window.TellerConnect) {
            if (typeof window.TellerConnect.setup === 'function') return window.TellerConnect.setup.bind(window.TellerConnect);
            if (typeof window.TellerConnect.create === 'function') return window.TellerConnect.create.bind(window.TellerConnect);
            if (typeof window.TellerConnect === 'function') return window.TellerConnect as unknown as TellerConnectFactory;
        }
        if (window.teller?.connect) {
            const connect = window.teller.connect;
            if (typeof connect.setup === 'function') return connect.setup.bind(connect);
            if (typeof connect.create === 'function') return connect.create.bind(connect);
            if (typeof connect === 'function') return connect as unknown as TellerConnectFactory;
        }
    } catch (error) {
        console.warn('Failed to resolve Teller Connect factory', error);
    }

    return null;
}

export async function openTellerConnect(options: TellerConnectOptions): Promise<TellerConnectInstance> {
    await loadScript();

    const factory = resolveFactory();
    if (!factory) {
        throw new Error('Teller Connect SDK is unavailable in this environment.');
    }

    const config: TellerConnectConfiguration = {
        applicationId: tellerApplicationId,
        onSuccess: options.onSuccess,
        onExit: options.onExit,
        onFailure: options.onFailure,
    };

    if (tellerEnvironment) {
        config.environment = tellerEnvironment;
    }
    if (tellerProducts && tellerProducts.length > 0) {
        config.products = tellerProducts;
    }
    if (tellerInstitution) {
        config.institution = tellerInstitution;
    }

    const instance = factory(config);
    if (!instance || typeof instance.open !== 'function') {
        throw new Error('Teller Connect returned an invalid instance.');
    }

    instance.open();
    return instance;
}

export async function prepareTellerConnect(): Promise<boolean> {
    try {
        return await loadScript();
    } catch (error) {
        console.error('Failed to prepare Teller Connect script', error);
        throw error;
    }
}
