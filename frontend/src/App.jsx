import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import CampusMap from './components/CampusMap';
import { useCampusRoute } from './hooks/useCampusRoute';

// ── Ikon SVG inline ──────────────────────────────────────────
const IconSearch = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>;
const IconReset = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const IconSpinner = () => <svg className="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>;
const IconMap = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>;
const IconSwap = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>;
const IconClock = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const IconRoute = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>;
const IconMenu = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>;
const IconClose = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>;
const IconPin = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const IconFlag = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z"/></svg>;
const IconWalking = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v8l8-11h-6z"/></svg>;
const IconMotorbike = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>;
const IconCar = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2m-6 4l-4-4 4-4"/></svg>;
const IconSun = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const IconCloudRain = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14.5A4.5 4.5 0 0014.5 10H14a7 7 0 10-13.9 1.5 5 5 0 009.4 0 3 3 0 004.5 3h1.5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 19l-2 2m0-4l-2 2m-2-4l-2 2"/></svg>;
// ── Helper ───────────────────────────────────────────────────
const formatDistance = (m) => m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m} m`;

const getVehicleIcon = (v) => {
    if (v === 'car') return <IconCar />;
    if (v === 'motorbike') return <IconMotorbike />;
    return <IconWalking />;
};
// ── Badge warna per tipe node ────────────────────────────────
const NodeTypeBadge = ({ type }) => {
    const map = {
        gate:     { label: 'Gerbang',      bg: 'bg-amber-500/20', text: 'text-amber-300' },
        junction: { label: 'Simpang',      bg: 'bg-violet-500/20', text: 'text-violet-300' },
        building: { label: 'Gedung',       bg: 'bg-blue-500/20', text: 'text-blue-300' },
    };
    const { label, bg, text } = map[type] ?? map.building;
    return <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${bg} ${text}`}>{label}</span>;
};

export default function App() {
    const {
        nodes, routePath, realRoutePath, routeInfo,
        loading, error, nodesLoading,
        fetchNodes, searchRoute, resetRoute,
    } = useCampusRoute();

    const [startCode, setStartCode] = useState('');
    const [endCode,   setEndCode]   = useState('');
    const [simTime,   setSimTime]   = useState('');
    const [vehicle,   setVehicle]   = useState('walking');
    const [weather,   setWeather]   = useState('clear');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => { fetchNodes(); }, [fetchNodes]);

    const handleSubmit = (e) => {
        e.preventDefault();
        searchRoute(startCode, endCode, simTime || null, vehicle, weather);
        setSidebarOpen(false);
    };

    const handleReset = () => {
        setStartCode('');
        setEndCode('');
        setSimTime('');
        resetRoute();
    };

    const handleSwap = () => {
        setStartCode(endCode);
        setEndCode(startCode);
    };

    const availableEnd   = nodes.filter(n => n.code !== startCode);
    const availableStart = nodes.filter(n => n.code !== endCode);

    return (
        <div className="flex h-screen bg-slate-900 font-sans overflow-hidden">

            {/* ── Mobile hamburger ── */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 glass-dark rounded-xl p-2.5 text-white shadow-lg"
                aria-label="Buka menu"
            >
                <IconMenu />
            </button>

            {/* ── Mobile overlay ── */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 z-40 overlay-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ═══════════════════════════════════════════════════════
                SIDEBAR — Panel Kontrol & Info Rute
            ══════════════════════════════════════════════════════ */}
            <aside className={`
                w-[380px] max-w-[85vw] glass-dark flex flex-col z-50 overflow-hidden
                fixed md:relative h-full
                transition-transform duration-300 ease-out
                ${sidebarOpen ? 'translate-x-0 sidebar-slide-in' : '-translate-x-full md:translate-x-0'}
            `}>

                {/* Header */}
                <div className="relative p-5 flex-shrink-0 overflow-hidden">
                    {/* Animated gradient bg */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 animate-gradient opacity-90" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/15 rounded-xl p-2 backdrop-blur-sm border border-white/10">
                                <IconMap />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white tracking-tight" style={{fontFamily:'Outfit, Inter, sans-serif'}}>
                                    UNIB Pathfinder
                                </h1>
                                <p className="text-indigo-200 text-xs flex items-center gap-1.5">
                                    A* Algorithm
                                    <span className="w-1 h-1 rounded-full bg-indigo-300/50" />
                                    Dynamic Heuristics
                                </p>
                            </div>
                        </div>
                        {/* Mobile close */}
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/70 hover:text-white p-1">
                            <IconClose />
                        </button>
                    </div>

                    {/* Status indicator */}
                    <div className="relative mt-3 flex items-center gap-2 text-xs text-white/60">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-ring" />
                        <span>{nodes.length > 0 ? `${nodes.length} titik kampus dimuat` : 'Memuat data...'}</span>
                    </div>
                </div>

                {/* Konten scroll */}
                <div className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-4">

                    {/* ── Form Pencarian ── */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Titik Awal */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                <span className="text-green-400"><IconPin /></span>
                                Titik Awal
                            </label>
                            <select
                                value={startCode}
                                onChange={e => setStartCode(e.target.value)}
                                disabled={nodesLoading}
                                required
                                className="custom-select w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm
                                           text-white placeholder-slate-500
                                           focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                                           disabled:opacity-40 transition-all duration-200"
                            >
                                <option value="" className="bg-slate-800">-- Pilih Lokasi Awal --</option>
                                {availableStart.map(n => (
                                    <option key={n.code} value={n.code} className="bg-slate-800">{n.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Swap button */}
                        <div className="flex items-center justify-center">
                            <div className="flex-1 h-px bg-white/5" />
                            <button
                                type="button"
                                onClick={handleSwap}
                                disabled={!startCode && !endCode}
                                title="Tukar titik awal & tujuan"
                                className="mx-3 p-1.5 rounded-lg bg-white/5 border border-white/10
                                           text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30
                                           transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <IconSwap />
                            </button>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>

                        {/* Tujuan */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                <span className="text-red-400"><IconFlag /></span>
                                Tujuan
                            </label>
                            <select
                                value={endCode}
                                onChange={e => setEndCode(e.target.value)}
                                disabled={nodesLoading}
                                required
                                className="custom-select w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm
                                           text-white
                                           focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                                           disabled:opacity-40 transition-all duration-200"
                            >
                                <option value="" className="bg-slate-800">-- Pilih Lokasi Tujuan --</option>
                                {availableEnd.map(n => (
                                    <option key={n.code} value={n.code} className="bg-slate-800">{n.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Simulasi Waktu */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                <span className="text-amber-400"><IconClock /></span>
                                Simulasi Waktu
                                <span className="normal-case font-normal text-slate-500 ml-0.5">(opsional)</span>
                            </label>
                            <input
                                type="time"
                                value={simTime}
                                onChange={e => setSimTime(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm
                                           text-white
                                           focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                                           transition-all duration-200"
                            />
                            <div className="flex gap-1.5 mt-2">
                                {[
                                    { t: '08:00', label: '🌅 Pagi' },
                                    { t: '12:30', label: '☀️ Siang' },
                                    { t: '10:00', label: '🟢 Normal' },
                                ].map(p => (
                                    <button
                                        key={p.t}
                                        type="button"
                                        onClick={() => setSimTime(p.t)}
                                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all duration-200
                                            ${simTime === p.t
                                                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-300 hover:border-white/20'
                                            }`}
                                    >
                                        {p.label} {p.t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pilihan Kendaraan */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                <span className="text-cyan-400"><IconWalking /></span>
                                Mode Transportasi
                            </label>
                            <div className="flex gap-2">
                                {[
                                    { id: 'walking', label: 'Jalan Kaki', icon: '🚶' },
                                    { id: 'motorbike', label: 'Motor', icon: '🏍️' },
                                    { id: 'car', label: 'Mobil', icon: '🚗' },
                                ].map(v => (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => setVehicle(v.id)}
                                        className={`flex-1 text-[11px] font-medium py-2 rounded-xl border transition-all duration-200 flex flex-col items-center gap-1
                                            ${vehicle === v.id
                                                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10'
                                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300'
                                            }`}
                                    >
                                        <span className="text-lg">{v.icon}</span>
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pilihan Cuaca */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setWeather('clear')}
                                className={`flex-1 text-[11px] font-medium py-2 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2
                                    ${weather === 'clear'
                                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300'
                                    }`}
                            >
                                <span className="text-amber-400"><IconSun /></span> Cerah
                            </button>
                            <button
                                type="button"
                                onClick={() => setWeather('rainy')}
                                className={`flex-1 text-[11px] font-medium py-2 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2
                                    ${weather === 'rainy'
                                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-lg shadow-blue-500/10'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300'
                                    }`}
                            >
                                <span className="text-blue-400"><IconCloudRain /></span> Hujan
                            </button>
                        </div>

                        {/* Tombol aksi */}
                        <div className="flex gap-2 pt-1">
                            <button
                                type="submit"
                                disabled={loading || nodesLoading}
                                className={`flex-1 flex items-center justify-center gap-2
                                           bg-gradient-to-r from-indigo-500 to-violet-500
                                           hover:from-indigo-400 hover:to-violet-400
                                           text-white font-semibold py-2.5 px-4 rounded-xl text-sm
                                           transition-all duration-200 shadow-lg shadow-indigo-500/25
                                           disabled:opacity-50 disabled:cursor-not-allowed
                                           ${!loading && !nodesLoading ? 'animate-pulse-glow' : ''}`}
                            >
                                {loading ? <><IconSpinner />Menghitung...</> : <><IconSearch />Cari Rute</>}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                title="Reset"
                                className="flex items-center justify-center
                                           bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20
                                           text-slate-400 hover:text-white py-2.5 px-3 rounded-xl text-sm
                                           transition-all duration-200"
                            >
                                <IconReset />
                            </button>
                        </div>
                    </form>

                    {/* ── Error Banner ── */}
                    {error && (
                        <div className="animate-fade-in glass-card bg-red-500/10 border-red-500/20 p-3.5 text-sm text-red-300 flex gap-2.5 items-start">
                            <span className="text-red-400 mt-0.5">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ── Panel Hasil Rute ── */}
                    {routeInfo && (
                        <div className="animate-fade-in space-y-3">

                            {/* Badge jam sibuk */}
                            {routeInfo.isPeakHour && (
                                <div className="glass-card bg-orange-500/10 border-orange-500/20 p-3.5">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-base">🚦</span>
                                        <span className="text-sm font-semibold text-orange-300">Jam Sibuk Aktif</span>
                                    </div>
                                    <p className="text-xs text-orange-200/70 leading-relaxed">
                                        Bobot jalur padat ditingkatkan. A* otomatis memilih rute alternatif yang lebih lancar.
                                    </p>
                                </div>
                            )}

                            {/* Statistik rute */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { icon: <IconRoute />, val: formatDistance(routeInfo.distance), label: 'Jarak' },
                                    { icon: getVehicleIcon(routeInfo.vehicle), val: `~${routeInfo.estimatedTime} min`, label: 'Waktu' },
                                    { icon: <IconPin />,   val: routeInfo.totalNodes, label: 'Titik' },
                                ].map((s, i) => (
                                    <div key={i} className="glass-card p-3 text-center animate-scale-pop" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className="flex justify-center text-indigo-400 mb-1">{s.icon}</div>
                                        <p className="text-base font-bold text-white">{s.val}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Navigasi Step-by-Step */}
                            <div>
                                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <IconRoute />
                                    Navigasi
                                </h3>
                                <ol className="space-y-0">
                                    {routeInfo.steps?.map((step, idx) => {
                                        const isFirst = idx === 0;
                                        const isLast  = idx === routeInfo.steps.length - 1;
                                        const dotBg =
                                            isFirst ? 'from-green-400 to-emerald-500' :
                                            isLast  ? 'from-red-400 to-rose-500' : 'from-indigo-400 to-violet-500';

                                        return (
                                            <li key={idx}
                                                className={`flex items-start gap-3 pb-3 animate-stagger ${!isLast ? 'timeline-line' : ''}`}
                                                style={{ animationDelay: `${idx * 80}ms` }}
                                            >
                                                <span className={`
                                                    w-6 h-6 rounded-full bg-gradient-to-br ${dotBg}
                                                    flex items-center justify-center text-white
                                                    text-[10px] font-bold flex-shrink-0 shadow-lg mt-0.5
                                                `}>
                                                    {isFirst ? '🟢' : isLast ? '🏁' : '➡️'}
                                                </span>
                                                <div className="min-w-0 flex-1 pt-1">
                                                    <p className="text-xs font-medium text-white/90 leading-relaxed">
                                                        {step}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="border-t border-white/5 pt-3">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                            Legenda Peta
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block shadow-sm shadow-blue-400/50" />
                                Gedung
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400/50" />
                                Gerbang
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block shadow-sm shadow-violet-500/50" />
                                Persimpangan
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-5 h-0.5 bg-indigo-500 rounded-full" />
                                Rute Normal
                            </div>
                            <div className="flex items-center gap-2 col-span-2">
                                <span className="inline-block w-5 h-0.5 bg-orange-500 rounded-full" style={{backgroundImage:'repeating-linear-gradient(90deg,#f97316 0,#f97316 3px,transparent 3px,transparent 6px)'}} />
                                Rute Jam Sibuk
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/5 flex-shrink-0">
                    <p className="text-[10px] text-slate-500 text-center">
                        Proyek UAS · Artificial Intelligence · Universitas Bengkulu
                    </p>
                </div>
            </aside>

            {/* ═══════════════════════════════════════════════════════
                AREA PETA — Konten Utama
            ══════════════════════════════════════════════════════ */}
            <main className="flex-1 relative">
                {/* Overlay loading */}
                {loading && (
                    <div className="absolute inset-0 map-loading-overlay z-20 flex items-center justify-center">
                        <div className="glass-dark rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl animate-scale-pop">
                            <div className="text-indigo-400"><IconSpinner /></div>
                            <div>
                                <p className="text-sm font-semibold text-white">Menghitung Rute...</p>
                                <p className="text-xs text-slate-400">Algoritma A* sedang berjalan</p>
                            </div>
                        </div>
                    </div>
                )}

                <CampusMap
                    routePath={routePath}
                    realRoutePath={realRoutePath}
                    routeInfo={routeInfo}
                    allNodes={nodes}
                />

                {/* Badge info di atas peta */}
                {!routeInfo && !loading && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10
                                    glass-dark rounded-2xl
                                    px-5 py-2.5 text-sm text-slate-300 pointer-events-none
                                    shadow-2xl animate-fade-in hidden md:block">
                        <span className="mr-1.5">👈</span>
                        Pilih titik awal dan tujuan di panel kiri untuk mulai
                    </div>
                )}
            </main>
        </div>
    );
}
