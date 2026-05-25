<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CampusEdge extends Model
{
    protected $fillable = [
        'node_from_id',
        'node_to_id',
        'distance_meters',
        'path_coordinates',
        'base_weight',
        'peak_weight',
        'congestion_zone',
        'is_bidirectional',
    ];

    protected $casts = [
        'distance_meters'  => 'float',
        'path_coordinates' => 'array',
        'base_weight'      => 'float',
        'peak_weight'      => 'float',
        'is_bidirectional' => 'boolean',
    ];

    public function nodeFrom()
    {
        return $this->belongsTo(CampusNode::class, 'node_from_id');
    }

    public function nodeTo()
    {
        return $this->belongsTo(CampusNode::class, 'node_to_id');
    }
}
