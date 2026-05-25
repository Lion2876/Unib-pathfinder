<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CampusNode extends Model
{
    protected $fillable = ['code', 'name', 'latitude', 'longitude', 'type'];

    protected $casts = [
        'latitude'  => 'float',
        'longitude' => 'float',
    ];

    public function edgesFrom()
    {
        return $this->hasMany(CampusEdge::class, 'node_from_id');
    }

    public function edgesTo()
    {
        return $this->hasMany(CampusEdge::class, 'node_to_id');
    }
}
