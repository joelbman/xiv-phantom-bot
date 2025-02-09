const zonesByExpansion = {
  arr: [
    'Middle La Noscea',
    'Lower La Noscea',
    'Eastern La Noscea',
    'Western La Noscea',
    'Upper La Noscea',
    'Outer La Noscea',
    'Western Thanalan',
    'Central Thanalan',
    'Eastern Thanalan',
    'Southern Thanalan',
    'Northern Thanalan',
    'Central Shroud',
    'East Shroud',
    'North Shroud',
    'Coerthas Central Highlands',
    'Mor Dhona',
  ],
  hw: [
    'Coerthas Western Highlands',
    'The Sea of Clouds',
    'The Dravanian Forelands',
    'The Churning Mists',
    'The Dravanian Hinterlands',
    'Azyz Lla',
  ],
  sb: ['The Fringes', 'The Peaks', 'The Ruby Sea', 'Yanxia', 'The Azim Steppe', 'The Lochs', 'Lochs'],
  shb: ['Lakeland', 'Kholusia', 'Amh Araeng', 'Il Mheg', "The Rak'tika Greatwood", 'The Tempest'],
  ew: ['Labyrinthos', 'Thavnair', 'Garlemald', 'Mare Lamentorum', 'Elpis', 'Ultima Thule'],
  dt: ['Urqopacha', "Kozama'uka", "Yak T'el", 'Shaaloani', 'Heritage Found', 'Living Memory'],
};

const zones = Object.entries(zonesByExpansion).flatMap((entry) => entry[1]);

export { zones, zonesByExpansion };
