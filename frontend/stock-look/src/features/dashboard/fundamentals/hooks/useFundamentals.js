import { useState, useEffect } from "react";
import { subscribeFundamentalFeed } from "../data/mockFeed";

export function useFundamentals() {
    const [marketData, setMarketData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let unsubscribe;
        try {
            unsubscribe = subscribeFundamentalFeed((snapshot) => {
                setMarketData(snapshot.data);
                setLoading(false);
            });
        } catch (err) {
            console.error("Failed to subscribe to fundamental feed:", err);
            setError(err.message);
            setLoading(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    return { marketData, loading, error };
}
