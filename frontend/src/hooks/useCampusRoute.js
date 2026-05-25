import { useState, useCallback } from 'react';
import axios from 'axios';

// Jika menggunakan Vite proxy, cukup /api.
// Jika deploy terpisah, set VITE_API_URL di .env
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

/**
 * useCampusRoute — Custom hook untuk manajemen state & logika rute.
 *
 * Memisahkan logika bisnis dari komponen UI (Separation of Concerns),
 * sehingga komponen hanya fokus pada tampilan.
 */
export function useCampusRoute() {
    const [nodes,     setNodes]     = useState([]);
    const [routePath, setRoutePath] = useState([]);   // Jalur Lurus (Graf)
    const [realRoutePath, setRealRoutePath] = useState([]); // Jalur Melengkung (Jalan Riil)
    const [routeInfo, setRouteInfo] = useState(null);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState(null);
    const [nodesLoading, setNodesLoading] = useState(false);

    /** Ambil semua node dari API untuk mengisi dropdown */
    const fetchNodes = useCallback(async () => {
        setNodesLoading(true);
        try {
            const { data } = await axios.get(`${API_BASE}/nodes`);
            setNodes(data);
        } catch {
            setError('Gagal memuat data node kampus. Pastikan server Laravel berjalan.');
        } finally {
            setNodesLoading(false);
        }
    }, []);

    /**
     * Kirim request pencarian rute ke Laravel A* API.
     *
     * Setelah response diterima:
     *   - data.path (array node) → diubah ke [[lat,lng],...] untuk Leaflet Polyline
     *   - routeInfo → disimpan terpisah untuk ditampilkan di panel info
     */
    const searchRoute = useCallback(async (startCode, endCode, time = null, vehicle = 'walking', weather = 'clear') => {
        if (!startCode || !endCode) return;
        if (startCode === endCode) {
            setError('Titik awal dan tujuan tidak boleh sama.');
            return;
        }

        setLoading(true);
        setError(null);
        setRoutePath([]);
        setRouteInfo(null);

        try {
            const { data } = await axios.post(`${API_BASE}/shortest-path`, {
                start:   startCode,
                end:     endCode,
                time:    time || null,
                vehicle: vehicle,
                weather: weather,
            });

            // Titik lurus antar node (untuk graf logic)
            const coordinates = data.path.map(node => [node.latitude, node.longitude]);
            setRoutePath(coordinates);

            // Titik melengkung realistis
            setRealRoutePath(data.route_coordinates || coordinates);

            setRouteInfo({
                nodes:         data.path,
                totalNodes:    data.total_nodes,
                distance:      data.distance_meters,
                isPeakHour:    data.is_peak_hour,
                peakInfo:      data.peak_info,
                vehicle:       data.vehicle,
                weather:       data.weather,
                estimatedTime: data.estimated_time,
                steps:         data.steps,
            });

        } catch (err) {
            if (err.response?.status === 404) {
                setError('Tidak ada rute yang menghubungkan kedua titik tersebut.');
            } else if (err.response?.status === 422) {
                setError(err.response.data?.message ?? 'Input tidak valid.');
            } else if (!err.response) {
                setError('Server tidak dapat dijangkau. Pastikan Laravel berjalan di port 8000.');
            } else {
                setError('Terjadi kesalahan saat menghitung rute.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const resetRoute = useCallback(() => {
        setRoutePath([]);
        setRealRoutePath([]);
        setRouteInfo(null);
        setError(null);
    }, []);

    return {
        nodes,
        routePath,
        realRoutePath,
        routeInfo,
        loading,
        error,
        nodesLoading,
        fetchNodes,
        searchRoute,
        resetRoute,
    };
}
