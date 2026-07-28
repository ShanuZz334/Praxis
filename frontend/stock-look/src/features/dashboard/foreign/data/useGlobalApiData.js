import { useState, useEffect } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';

export function useGlobalApiData() {
    const [liveApiData, setLiveApiData] = useState({});
    
    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_PATHS.DATA.GLOBAL);
                if (mounted && res.data?.data) {
                    setLiveApiData(res.data.data);
                }
            } catch(e) {
                console.error("Failed to fetch global live data", e);
            }
        };
        
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000); // refresh every 5 mins
        
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    return liveApiData;
}
