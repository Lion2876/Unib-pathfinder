<?php

namespace App\Services;

use App\Models\CampusNode;
use App\Models\CampusEdge;
use SplMinHeap;


class AStarService
{
    /** Jam sibuk dalam format [menit_mulai, menit_selesai] */
    private array $peakHours = [
        [7  * 60 + 30, 9  * 60 + 0 ],  // 07:30 - 09:00
        [12 * 60 + 0,  13 * 60 + 30],  // 12:00 - 13:30
        [15 * 60 + 30, 17 * 60 + 0 ],  // 15:30 - 17:00
    ];

    /**
     * Jalankan algoritma A* dari $startCode ke $endCode.
     *
     * @param  string       $startCode  Kode node awal  (misal: "GATE_UTAMA")
     * @param  string       $endCode    Kode node tujuan (misal: "FKIP")
     * @param  string|null  $time       Format "HH:MM"; null = waktu server saat ini
     * @param  string       $vehicle    Tipe kendaraan (walking, motorbike, car)
     * @return array        Array node yang membentuk rute, kosong jika tidak ditemukan
     */
    public function findPath(string $startCode, string $endCode, ?string $time = null, string $vehicle = 'walking'): array
    {
        // Muat semua node & edge sekali dari DB (hindari N+1 query)
        $allNodes  = CampusNode::all()->keyBy('id');
        $allEdges  = CampusEdge::all();

        $startNode = CampusNode::where('code', $startCode)->firstOrFail();
        $endNode   = CampusNode::where('code', $endCode)->firstOrFail();

        // Bangun adjacency list berbobot dinamis berdasarkan kendaraan
        $adjacency = $this->buildAdjacencyList($allEdges, $time, $vehicle);

        // ── Inisialisasi struktur data A* ──────────────────────────────
        // Priority Queue: node dengan f(n) terkecil diproses terlebih dulu.
        // Ini kunci efisiensi A* dibanding Dijkstra (tidak eksplorasi semua arah).
        $openSet = new SplMinHeap();

        // g[id] = biaya terbaik yang diketahui dari start ke node id
        $gScore = [];
        foreach ($allNodes as $id => $node) {
            $gScore[$id] = PHP_FLOAT_MAX;  // inisialisasi "tak terhingga"
        }
        $gScore[$startNode->id] = 0.0;

        // cameFrom[id] = id node sebelumnya dalam rute terbaik ke id
        $cameFrom = [];

        $hStart = $this->heuristic($startNode, $endNode);
        $openSet->insert([$hStart, $startNode->id]);

        // ── Loop utama A* ──────────────────────────────────────────────
        while (!$openSet->isEmpty()) {
            [$currentF, $currentId] = $openSet->extract();
            $currentNode = $allNodes[$currentId];

            // ✅ Tujuan tercapai → rekonstruksi dan kembalikan rute
            if ($currentId === $endNode->id) {
                return $this->reconstructPath($cameFrom, $currentId, $allNodes);
            }

            if (empty($adjacency[$currentId])) {
                continue;
            }

            foreach ($adjacency[$currentId] as $neighbor) {
                $neighborId = $neighbor['neighbor_id'];

                if (!isset($allNodes[$neighborId])) {
                    continue;
                }

                // g(neighbor) via current
                $tentativeG = $gScore[$currentId] + $neighbor['cost'];

                if ($tentativeG < $gScore[$neighborId]) {
                    // Rute lebih baik ditemukan → perbarui
                    $cameFrom[$neighborId] = $currentId;
                    $gScore[$neighborId]   = $tentativeG;

                    $h = $this->heuristic($allNodes[$neighborId], $endNode);
                    $f = $tentativeG + $h;
                    $openSet->insert([$f, $neighborId]);
                }
            }
        }

        // Tidak ada rute yang ditemukan
        return [];
    }

    /**
     * Periksa status jam sibuk secara publik (untuk response API).
     */
    public function checkPeakHour(?string $time = null): bool
    {
        return $this->isPeakHour($time);
    }

    private function buildAdjacencyList(iterable $edges, ?string $time, string $vehicle): array
    {
        $adjacency  = [];
        $isPeak     = $this->isPeakHour($time);

        foreach ($edges as $edge) {
            // Hitung bobot efektif berdasarkan jenis kendaraan
            if ($vehicle === 'walking') {
                // Pejalan kaki bebas macet
                $weight = $edge->base_weight;
            } elseif ($vehicle === 'motorbike') {
                // Motor terkena efek macet setengah (bisa selap-selip)
                $weight = $isPeak ? 1 + (($edge->peak_weight - 1) * 0.5) : $edge->base_weight;
            } else {
                // Mobil (car) terkena efek macet penuh
                $weight = $isPeak ? $edge->peak_weight : $edge->base_weight;
            }

            $cost   = $edge->distance_meters * $weight;

            // Arah maju: from → to
            $adjacency[$edge->node_from_id][] = [
                'neighbor_id' => $edge->node_to_id,
                'cost'        => $cost,
            ];

            // Arah balik: to → from (jika bidirectional)
            if ($edge->is_bidirectional) {
                $adjacency[$edge->node_to_id][] = [
                    'neighbor_id' => $edge->node_from_id,
                    'cost'        => $cost,
                ];
            }
        }

        return $adjacency;
    }

    /**
     * Heuristik h(n): estimasi biaya dari $nodeA ke $nodeB.
     *
     * Menggunakan Haversine (jarak GPS garis lurus) dalam meter.
     * Bersifat admissible karena jarak lurus ≤ jarak jalur nyata.
     * Tanpa sifat ini, A* tidak dijamin menemukan rute optimal.
     */
    private function heuristic(CampusNode $nodeA, CampusNode $nodeB): float
    {
        return $this->haversineDistance(
            $nodeA->latitude, $nodeA->longitude,
            $nodeB->latitude, $nodeB->longitude
        );
    }

    /**
     * Rumus Haversine: jarak antara dua titik koordinat GPS (dalam meter).
     */
    private function haversineDistance(
        float $lat1, float $lon1,
        float $lat2, float $lon2
    ): float {
        $R  = 6371000; // Jari-jari bumi (meter)
        $φ1 = deg2rad($lat1);
        $φ2 = deg2rad($lat2);
        $Δφ = deg2rad($lat2 - $lat1);
        $Δλ = deg2rad($lon2 - $lon1);

        $a = sin($Δφ / 2) ** 2 + cos($φ1) * cos($φ2) * sin($Δλ / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $R * $c;
    }

    /**
     * Cek apakah $time masuk dalam salah satu slot jam sibuk.
     */
    private function isPeakHour(?string $time): bool
    {
        $timeStr   = $time ?? now()->format('H:i');
        [$h, $m]   = explode(':', $timeStr);
        $totalMins = (int) $h * 60 + (int) $m;

        foreach ($this->peakHours as [$start, $end]) {
            if ($totalMins >= $start && $totalMins <= $end) {
                return true;
            }
        }

        return false;
    }

    /**
     * Rekonstruksi rute dengan menelusuri $cameFrom dari tujuan ke awal.
     * Hasilnya di-reverse agar urutannya dari awal → tujuan.
     */
    private function reconstructPath(array $cameFrom, int $currentId, $allNodes): array
    {
        $path = [];

        while (isset($cameFrom[$currentId])) {
            $node   = $allNodes[$currentId];
            $path[] = $this->formatNode($node);
            $currentId = $cameFrom[$currentId];
        }

        // Tambahkan node awal (tidak ada di cameFrom)
        $path[] = $this->formatNode($allNodes[$currentId]);

        return array_reverse($path);
    }

    private function formatNode($node): array
    {
        return [
            'id'        => $node->id,
            'code'      => $node->code,
            'name'      => $node->name,
            'type'      => $node->type,
            'latitude'  => (float) $node->latitude,
            'longitude' => (float) $node->longitude,
        ];
    }
}
