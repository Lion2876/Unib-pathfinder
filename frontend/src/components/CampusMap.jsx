import { useEffect, useState } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    CircleMarker,
    useMap,
    Tooltip,
} from 'react-leaflet';
import L from 'leaflet';

// ── Fix ikon Leaflet yang hilang di Vite ──────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Ikon marker titik awal (hijau) dan tujuan (merah)
const makeIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
const startIcon = makeIcon('green');
const endIcon   = makeIcon('red');

/** Koordinat pusat kampus UNIB */
const UNIB_CENTER = [-3.7598, 102.2738];

// ── Sub-komponen: auto-fit peta ke rute yang ditemukan ────
function FitBounds({ routePath }) {
    const map = useMap();
    useEffect(() => {
        if (routePath.length > 1) {
            map.fitBounds(L.latLngBounds(routePath), { padding: [80, 80], maxZoom: 18 });
        }
    }, [routePath, map]);
    return null;
}

// ── Warna node berdasarkan tipe ──────────────────────────
const nodeColors = {
    gate:     { fill: '#f59e0b', stroke: '#d97706' },
    junction: { fill: '#8b5cf6', stroke: '#7c3aed' },
    building: { fill: '#3b82f6', stroke: '#2563eb' },
};

// ── Ikon & label tipe node ───────────────────────────────
const nodeLabels = {
    gate:     { icon: '🚪', label: 'Gerbang' },
    junction: { icon: '🔀', label: 'Persimpangan' },
    building: { icon: '🏛️', label: 'Gedung' },
};

// ─────────────────────────────────────────────────────────
//  Komponen Utama CampusMap
// ─────────────────────────────────────────────────────────
export default function CampusMap({ routePath, realRoutePath, routeInfo, allNodes }) {
    const isPeak = routeInfo?.isPeakHour;
    
    // State untuk animasi
    const [animatedRealRoute, setAnimatedRealRoute] = useState([]);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (!realRoutePath || realRoutePath.length === 0) {
            setAnimatedRealRoute([]);
            setAnimating(false);
            return;
        }

        setAnimatedRealRoute([realRoutePath[0]]);
        setAnimating(true);
        
        let currentIdx = 0;
        // Kecepatan animasi berdasarkan panjang rute agar tidak terlalu lama
        const speed = Math.max(5, 30 - Math.floor(realRoutePath.length / 10));

        const interval = setInterval(() => {
            currentIdx++;
            if (currentIdx >= realRoutePath.length) {
                clearInterval(interval);
                setAnimating(false);
                setAnimatedRealRoute(realRoutePath);
            } else {
                setAnimatedRealRoute(realRoutePath.slice(0, currentIdx + 1));
            }
        }, speed);

        return () => clearInterval(interval);
    }, [realRoutePath]);

    // Warna dan style polyline berubah berdasarkan status jam sibuk
    const routeColor   = isPeak ? '#f97316' : '#6366f1';
    const shadowColor  = isPeak ? '#7c2d12' : '#312e81';
    const dashPattern  = isPeak ? '12 6' : null;

    return (
        <MapContainer
            center={UNIB_CENTER}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
        >
            {/* Peta dasar — CartoDB Voyager (Lebih berwarna) */}
            <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* Auto-fit ke bounding box rute */}
            <FitBounds routePath={realRoutePath || routePath} />

            {/* ── Semua node kampus sebagai dot ────────────────── */}
            {allNodes.map(node => {
                const colors = nodeColors[node.type] ?? nodeColors.building;
                const info   = nodeLabels[node.type] ?? nodeLabels.building;

                return (
                    <CircleMarker
                        key={node.code}
                        center={[node.latitude, node.longitude]}
                        radius={7}
                        pathOptions={{
                            color: colors.stroke,
                            fillColor: colors.fill,
                            fillOpacity: 0.8,
                            weight: 2,
                        }}
                    >
                        <Tooltip permanent direction="top" opacity={0.8} offset={[0, -10]}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                                {node.type === 'junction' ? node.code : node.name}
                            </span>
                        </Tooltip>
                        <Popup maxWidth={220}>
                            <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 4px 0', color: '#1e293b' }}>
                                    {node.name}
                                </p>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>{info.icon}</span>
                                    <span>{info.label}</span>
                                    <span style={{ color: '#cbd5e1' }}>·</span>
                                    <span style={{ fontFamily: 'monospace', fontSize: '11px', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                                        {node.code}
                                    </span>
                                </p>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}

            {/* ══════════════════════════════════════════════════
                POLYLINE — Menggambar Rute Hasil A*
                ══════════════════════════════════════════════════
                Dua layer polyline digunakan:
                - realRoutePath: Garis solid mengikuti kontur jalan
                - routePath: Garis putus-putus (dotted) logika graf
            ═══════════════════════════════════════════════════ */}
            {animatedRealRoute && animatedRealRoute.length > 1 && (
                <>
                    {/* Shadow polyline untuk rute nyata */}
                    <Polyline
                        positions={animatedRealRoute}
                        pathOptions={{
                            color:   shadowColor,
                            weight:  12,
                            opacity: 0.25,
                            lineCap: 'round',
                        }}
                    />
                    {/* Polyline utama (Jalur Riil) */}
                    <Polyline
                        positions={animatedRealRoute}
                        pathOptions={{
                            color:     routeColor,
                            weight:    6,
                            opacity:   0.85,
                            lineCap:   'round',
                            lineJoin:  'round',
                        }}
                    />
                </>
            )}

            {routePath && routePath.length > 1 && (
                <>
                    {/* Polyline Logika Graf (Dotted Line antar Node) - Hidden for cleaner look */}
                    {/* <Polyline
                        positions={routePath}
                        pathOptions={{
                            color:     '#475569', // Warna abu-abu gelap agar lebih terlihat
                            weight:    5,         // Dibuat lebih tebal
                            opacity:   0.9,
                            dashArray: '8 8',     // Dotted lebih jelas
                            lineCap:   'round',
                            lineJoin:  'round',
                        }}
                    /> */}

                    {/* Waypoint markers temporarily hidden to make path look cleaner/direct */}
                    {/* {!animating && routeInfo?.nodes.slice(1, -1).map((node) => (
                        <CircleMarker
                            key={`wp-${node.id}`}
                            center={[node.latitude, node.longitude]}
                            radius={6}
                            pathOptions={{
                                color:       '#fff',
                                fillColor:   routeColor,
                                fillOpacity: 1,
                                weight:      2.5,
                            }}
                        >
                            <Popup>
                                <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                    <p style={{ fontWeight: 600, fontSize: '13px', margin: 0, color: '#1e293b' }}>{node.name}</p>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))} */}
                </>
            )}

            {/* Marker Titik Awal (hijau) */}
            {routeInfo?.nodes?.[0] && (
                <Marker
                    position={[routeInfo.nodes[0].latitude, routeInfo.nodes[0].longitude]}
                    icon={startIcon}
                >
                    <Popup>
                        <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                            <p style={{ fontWeight: 700, color: '#16a34a', margin: '0 0 2px 0', fontSize: '13px' }}>🟢 Titik Awal</p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>{routeInfo.nodes[0].name}</p>
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* Marker Titik Tujuan (merah) */}
            {routeInfo?.nodes && routeInfo.nodes.length > 1 && (() => {
                const last = routeInfo.nodes[routeInfo.nodes.length - 1];
                return (
                    <Marker position={[last.latitude, last.longitude]} icon={endIcon}>
                        <Popup>
                            <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                <p style={{ fontWeight: 700, color: '#dc2626', margin: '0 0 2px 0', fontSize: '13px' }}>🔴 Tujuan</p>
                                <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>{last.name}</p>
                            </div>
                        </Popup>
                    </Marker>
                );
            })()}
        </MapContainer>
    );
}
