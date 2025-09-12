"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import axios from "axios";

type ConnectorsStatus = {
    aws: boolean;
    azure: boolean;
};

type ConnectorContextType = {
    connectors: ConnectorsStatus;
    setConnector: (key: keyof ConnectorsStatus, value: boolean) => void;
    user: User | null;
    idToken: string | null;
};

const ConnectorContext = createContext<ConnectorContextType | undefined>(undefined);

export const ConnectorProvider = ({ children }: { children: ReactNode }) => {
    const [connectors, setConnectors] = useState<ConnectorsStatus>({
        aws: false,
        azure: false,
    });

    const [user, setUser] = useState<User | null>(null);
    const [loader, setloader] = useState(true)
    const [idToken, setIdToken] = useState<string | null>(null);

    // Track auth state
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                const token = await u.getIdToken();
                setIdToken(token);
            } else {
                setIdToken(null);
                setloader(false);
                window.location.replace("/");
                setConnectors({ aws: false, azure: false });
            }
        });
        return () => unsub();
    }, []);

    // Fetch connector status from backend once ID token is ready
    useEffect(() => {
        const fetchStatus = async () => {
            if (!idToken) return;
            try {
                setloader(true)
                const res = await axios.get("http://127.0.0.1:8000/api/connectors/status", {
                    headers: { Authorization: `Bearer ${idToken}` },
                });

                setConnectors(res.data);
            } catch (err) {
                console.error("Failed to fetch connector status:", err);
            } finally {
                setloader(false)
            }
        };
        fetchStatus();
    }, [idToken]);

    const setConnector = (key: keyof ConnectorsStatus, value: boolean) => {
        setConnectors((prev) => ({ ...prev, [key]: value }));
    };

    if (loader) {
        return (<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500">.........</div>)
    }

    return (
        <ConnectorContext.Provider value={{ connectors, setConnector, user, idToken }}>
            {children}
        </ConnectorContext.Provider>
    );
};

// Custom hook
export const useConnector = () => {
    const context = useContext(ConnectorContext);
    if (!context) {
        throw new Error("useConnector must be used within ConnectorProvider");
    }
    return context;
};
