<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CampusNode;
use App\Services\AStarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RouteController extends Controller
{
    public function __construct(private AStarService $astar) {}

    /**
     * GET /api/nodes
     * Kembalikan semua node kampus untuk mengisi dropdown di frontend.
     */
    public function getNodes(): JsonResponse
    {
        $nodes = CampusNode::select('id', 'code', 'name', 'latitude', 'longitude', 'type')
            ->orderBy('name')
            ->get();

        return response()->json($nodes);
    }

    /**
     * POST /api/shortest-path
     *
     * Request Body:
     * {
     *   "start": "GATE_UTAMA",
     *   "end":   "FKIP",
     *   "time":  "12:30"    ← opsional
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "path": [ { id, code, name, latitude, longitude }, ... ],
     *   "total_nodes": 5,
     *   "distance_meters": 630,
     *   "is_peak_hour": true
     * }
     */
    public function getShortestPath(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start'   => 'required|string|exists:campus_nodes,code',
            'end'     => 'required|string|exists:campus_nodes,code',
            'time'    => 'nullable|string|regex:/^\d{2}:\d{2}$/',
            'vehicle' => 'nullable|string|in:walking,motorbike,car',
            'weather' => 'nullable|string|in:clear,rainy',
        ]);

        if ($validated['start'] === ($validated['end'] ?? '')) {
            return response()->json([
                'success' => false,
                'message' => 'Titik awal dan tujuan tidak boleh sama.',
            ], 422);
        }

        $vehicle = $validated['vehicle'] ?? 'walking';

        $path = $this->astar->findPath(
            startCode: $validated['start'],
            endCode:   $validated['end'],
            time:      $validated['time'] ?? null,
            vehicle:   $vehicle
        );

        if (empty($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada rute yang menghubungkan kedua titik tersebut.',
            ], 404);
        }

        $distanceMeters = $this->calculateTotalDistance($path);
        $isPeakHour     = $this->astar->checkPeakHour($validated['time'] ?? null);

        // Membangun koordinat riil (melengkung)
        $routeCoordinates = [];
        for ($i = 0; $i < count($path); $i++) {
            $node = $path[$i];
            
            // Tambahkan titik node saat ini
            $routeCoordinates[] = [$node['latitude'], $node['longitude']];
            
            // Cari edge ke node berikutnya (jika ada) untuk mengekstrak path_coordinates
            if ($i < count($path) - 1) {
                $nextNode = $path[$i+1];
                
                $edge = \App\Models\CampusEdge::where(function($query) use ($node, $nextNode) {
                    $query->where('node_from_id', $node['id'])
                          ->where('node_to_id', $nextNode['id']);
                })->orWhere(function($query) use ($node, $nextNode) {
                    $query->where('node_from_id', $nextNode['id'])
                          ->where('node_to_id', $node['id']);
                })->first();

                if ($edge && !empty($edge->path_coordinates)) {
                    $edgeCoords = $edge->path_coordinates;
                    // Jika jalur kita berjalan dari to -> from, balik array-nya
                    if ($edge->node_to_id === $node['id']) {
                        $edgeCoords = array_reverse($edgeCoords);
                    }
                    
                    // Abaikan koordinat pertama dan terakhir dari path_coordinates 
                    // karena sudah diwakili oleh $node dan $nextNode
                    if (count($edgeCoords) > 2) {
                        $middleCoords = array_slice($edgeCoords, 1, -1);
                        foreach ($middleCoords as $coord) {
                            $routeCoordinates[] = $coord;
                        }
                    }
                }
            }
        }

        // Generate Navigasi Step-by-Step
        $steps = [];
        for ($i = 0; $i < count($path); $i++) {
            $node = $path[$i];
            if ($i === 0) {
                $steps[] = "Mulai perjalanan dari {$node['name']}.";
            } else {
                $prevNode = $path[$i-1];
                $dist = $this->haversine($prevNode['latitude'], $prevNode['longitude'], $node['latitude'], $node['longitude']);
                $distRound = round($dist);
                
                if ($i === count($path) - 1) {
                    $steps[] = "Berjalan sejauh {$distRound}m menuju tujuan akhir Anda di {$node['name']}.";
                } else {
                    $typeStr = $node['type'] === 'junction' ? 'persimpangan' : 'titik';
                    $steps[] = "Lanjutkan sejauh {$distRound}m menuju {$typeStr} {$node['name']}.";
                }
            }
        }

        $weather = $validated['weather'] ?? 'clear';

        // Hitung estimasi waktu berdasarkan cuaca
        $speeds = [
            'walking'   => 83.3, // ~5 km/h
            'motorbike' => 500,  // ~30 km/h
            'car'       => 333,  // ~20 km/h
        ];

        if ($weather === 'rainy') {
            $speeds['walking']   = 33.3; // ~2 km/h (Sangat lambat karena hujan)
            $speeds['motorbike'] = 250;  // ~15 km/h (Melambat)
            $speeds['car']       = 300;  // ~18 km/h (Sedikit melambat)
        }

        $speed = $speeds[$vehicle];
        $estimatedTimeMinutes = max(1, round($distanceMeters / $speed));

        return response()->json([
            'success'           => true,
            'path'              => $path,
            'route_coordinates' => $routeCoordinates,
            'steps'             => $steps,
            'total_nodes'       => count($path),
            'distance_meters'   => (int) round($distanceMeters),
            'vehicle'           => $vehicle,
            'weather'           => $weather,
            'estimated_time'    => $estimatedTimeMinutes,
            'is_peak_hour'      => $isPeakHour,
            'peak_info'         => $isPeakHour
                ? 'Jam sibuk aktif — bobot jalur padat ditingkatkan, rute alternatif diprioritaskan.'
                : 'Kondisi normal — rute berdasarkan jarak fisik terpendek.',
        ]);
    }

    // ── Helper ───────────────────────────────────────────────────

    private function calculateTotalDistance(array $path): float
    {
        $total = 0.0;
        for ($i = 0; $i < count($path) - 1; $i++) {
            $total += $this->haversine(
                $path[$i]['latitude'],  $path[$i]['longitude'],
                $path[$i+1]['latitude'], $path[$i+1]['longitude'],
            );
        }
        return $total;
    }

    private function haversine(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $R  = 6371000;
        $φ1 = deg2rad($lat1); $φ2 = deg2rad($lat2);
        $Δφ = deg2rad($lat2 - $lat1); $Δλ = deg2rad($lon2 - $lon1);
        $a  = sin($Δφ/2)**2 + cos($φ1)*cos($φ2)*sin($Δλ/2)**2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
