import { useEffect, useRef, useState } from "react";
import { subscribeFundamentalFeed } from "./mockFeed";

/**
 * Industry-grade live history hook
 * - Stable
 * - Memory-safe
 * - Chart-friendly
 */
export function useHistory(maxPoints = 60) {
  const [history, setHistory] = useState({});
  const historyRef = useRef({});
  const lastTsRef = useRef(0);

  useEffect(() => {
    const unsubscribe = subscribeFundamentalFeed(
      ({ timestamp, data }) => {
        // Ignore duplicate / out-of-order ticks
        if (timestamp <= lastTsRef.current) return;
        lastTsRef.current = timestamp;

        let changed = false;

        Object.keys(data).forEach((key) => {
          const value = data[key];
          if (!isFinite(value)) return;

          const series =
            historyRef.current[key] ||
            (historyRef.current[key] = []);

          series.push({ ts: timestamp, value });

          if (series.length > maxPoints) {
            series.shift();
          }

          changed = true;
        });

        // Only trigger React update if something actually changed
        if (changed) {
          setHistory({ ...historyRef.current });
        }
      }
    );

    return unsubscribe;
  }, [maxPoints]);

  return history;
}
