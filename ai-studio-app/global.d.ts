export {};

declare global {
    interface TellerConnectSDK {
        setup?: (config: unknown) => { open: () => void };
        create?: (config: unknown) => { open: () => void };
        (config: unknown): { open: () => void };
    }

    interface TellerLegacySDK {
        connect?: TellerConnectSDK;
    }

    interface Window {
        TellerConnect?: TellerConnectSDK;
        teller?: TellerLegacySDK;
    }
}
