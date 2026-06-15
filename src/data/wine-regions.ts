export interface RegionCoord {
  lat: number
  lng: number
  state?: string
}

export const AUSTRALIAN_REGIONS: Record<string, RegionCoord> = {
  // NEW SOUTH WALES
  'Hunter Valley':        { lat: -32.75, lng: 151.25, state: 'NSW' },
  'Orange':               { lat: -33.28, lng: 149.10, state: 'NSW' },
  'Mudgee':               { lat: -32.59, lng: 149.59, state: 'NSW' },
  'Canberra District':    { lat: -35.02, lng: 149.00, state: 'NSW' },
  'Shoalhaven Coast':     { lat: -34.75, lng: 150.75, state: 'NSW' },
  'Tumbarumba':           { lat: -35.78, lng: 148.01, state: 'NSW' },
  'Hilltops':             { lat: -34.23, lng: 148.58, state: 'NSW' },
  'Riverina':             { lat: -34.28, lng: 146.06, state: 'NSW' },
  'Gundagai':             { lat: -35.07, lng: 148.10, state: 'NSW' },
  'Armidale':             { lat: -30.51, lng: 151.67, state: 'NSW' },
  'Central Ranges':       { lat: -33.40, lng: 149.10, state: 'NSW' },

  // SOUTH AUSTRALIA
  'Barossa Valley':       { lat: -34.56, lng: 138.95, state: 'SA' },
  'Barossa':              { lat: -34.56, lng: 138.95, state: 'SA' },  // alias
  'Eden Valley':          { lat: -34.65, lng: 139.05, state: 'SA' },
  'Clare Valley':         { lat: -33.83, lng: 138.61, state: 'SA' },
  'Clare':                { lat: -33.83, lng: 138.61, state: 'SA' },  // alias
  'McLaren Vale':         { lat: -35.22, lng: 138.55, state: 'SA' },
  'Blewitt Springs':      { lat: -35.18, lng: 138.56, state: 'SA' },  // McLaren Vale sub-region
  'Adelaide Hills':       { lat: -35.02, lng: 138.72, state: 'SA' },
  'Coonawarra':           { lat: -37.29, lng: 140.83, state: 'SA' },
  'Langhorne Creek':      { lat: -35.30, lng: 139.03, state: 'SA' },
  'Padthaway':            { lat: -36.62, lng: 140.52, state: 'SA' },
  'Wrattonbully':         { lat: -36.83, lng: 140.90, state: 'SA' },
  'Robe':                 { lat: -37.16, lng: 139.76, state: 'SA' },
  'Mount Benson':         { lat: -36.98, lng: 139.88, state: 'SA' },
  'Riverland':            { lat: -34.18, lng: 140.75, state: 'SA' },
  'South Australia':      { lat: -34.90, lng: 138.60, state: 'SA' },  // generic fallback
  'South Australia Blend': { lat: -34.90, lng: 138.60, state: 'SA' },

  // VICTORIA
  'Yarra Valley':         { lat: -37.75, lng: 145.50, state: 'VIC' },
  'Beechworth':           { lat: -36.36, lng: 146.69, state: 'VIC' },
  'Bendigo':              { lat: -36.76, lng: 144.28, state: 'VIC' },
  'Heathcote':            { lat: -36.92, lng: 144.71, state: 'VIC' },
  'Grampians':            { lat: -37.15, lng: 142.60, state: 'VIC' },
  'Mornington Peninsula': { lat: -38.35, lng: 145.10, state: 'VIC' },
  'Macedon Ranges':       { lat: -37.30, lng: 144.55, state: 'VIC' },
  'Gippsland':            { lat: -38.30, lng: 146.00, state: 'VIC' },
  'Rutherglen':           { lat: -36.05, lng: 146.46, state: 'VIC' },
  'Nagambie Lakes':       { lat: -36.78, lng: 145.15, state: 'VIC' },
  'Geelong':              { lat: -38.15, lng: 144.35, state: 'VIC' },
  'Bellarine Peninsula':  { lat: -38.15, lng: 144.62, state: 'VIC' },
  'Bellarine Penisular':  { lat: -38.15, lng: 144.62, state: 'VIC' },  // common misspelling
  'King Valley':          { lat: -36.60, lng: 146.40, state: 'VIC' },
  'Pyrenees':             { lat: -37.10, lng: 143.55, state: 'VIC' },
  'Sunbury':              { lat: -37.58, lng: 144.73, state: 'VIC' },

  // WESTERN AUSTRALIA
  'Margaret River':       { lat: -33.95, lng: 115.08, state: 'WA' },
  'Frankland River':      { lat: -34.37, lng: 116.85, state: 'WA' },
  'Mount Barker':         { lat: -34.63, lng: 117.66, state: 'WA' },
  'Great Southern':       { lat: -34.60, lng: 117.40, state: 'WA' },
  'Porongurup':           { lat: -34.68, lng: 117.87, state: 'WA' },
  'Pemberton':            { lat: -34.45, lng: 116.03, state: 'WA' },
  'Swan Valley':          { lat: -31.83, lng: 116.02, state: 'WA' },

  // TASMANIA
  'Tasmania':             { lat: -42.00, lng: 146.80, state: 'TAS' },
  'Tamar Valley':         { lat: -41.30, lng: 146.95, state: 'TAS' },
  'Coal River Valley':    { lat: -42.73, lng: 147.42, state: 'TAS' },

  // QUEENSLAND
  'Granite Belt':         { lat: -28.62, lng: 151.85, state: 'QLD' },
}

export const INTERNATIONAL_REGIONS: Record<string, RegionCoord & { country: string }> = {
  // FRANCE
  'Bordeaux':             { lat: 44.84, lng: -0.57, country: 'France' },
  'Burgundy':             { lat: 47.05, lng: 4.38, country: 'France' },
  'Rhône Valley':         { lat: 44.10, lng: 4.83, country: 'France' },
  'Rhône':                { lat: 44.10, lng: 4.83, country: 'France' },  // alias
  'Champagne':            { lat: 49.25, lng: 3.96, country: 'France' },
  'Loire Valley':         { lat: 47.38, lng: 0.69, country: 'France' },
  'Alsace':               { lat: 48.32, lng: 7.44, country: 'France' },
  'Languedoc':            { lat: 43.61, lng: 3.88, country: 'France' },
  'Minervois':            { lat: 43.32, lng: 2.62, country: 'France' },
  'Cahors':               { lat: 44.45, lng: 1.44, country: 'France' },
  'Provence':             { lat: 43.53, lng: 6.03, country: 'France' },

  // ITALY
  'Tuscany':              { lat: 43.35, lng: 11.35, country: 'Italy' },
  'Piedmont':             { lat: 44.70, lng: 8.03, country: 'Italy' },
  'Langhe':               { lat: 44.62, lng: 8.00, country: 'Italy' },
  'Alba':                 { lat: 44.70, lng: 8.04, country: 'Italy' },
  'Veneto':               { lat: 45.44, lng: 12.33, country: 'Italy' },
  'Valpolicella':         { lat: 45.55, lng: 10.92, country: 'Italy' },
  'Verona':               { lat: 45.44, lng: 10.99, country: 'Italy' },
  'Sicily':               { lat: 37.60, lng: 14.27, country: 'Italy' },
  'Puglia':               { lat: 41.13, lng: 16.87, country: 'Italy' },
  'Basilicata':           { lat: 40.64, lng: 15.80, country: 'Italy' },
  'Sardinia':             { lat: 39.22, lng: 9.10, country: 'Italy' },

  // USA
  'Napa Valley':          { lat: 38.50, lng: -122.27, country: 'United States' },
  'Sonoma':               { lat: 38.29, lng: -122.46, country: 'United States' },
  'Willamette Valley':    { lat: 45.22, lng: -122.98, country: 'United States' },
  'Paso Robles':          { lat: 35.63, lng: -120.69, country: 'United States' },

  // CHILE
  'Maipo Valley':         { lat: -33.70, lng: -70.70, country: 'Chile' },
  'Maipo':                { lat: -33.70, lng: -70.70, country: 'Chile' },  // alias
  'Colchagua Valley':     { lat: -34.67, lng: -71.17, country: 'Chile' },
  'Casablanca Valley':    { lat: -33.32, lng: -71.42, country: 'Chile' },

  // ARGENTINA
  'Mendoza':              { lat: -32.88, lng: -68.83, country: 'Argentina' },
  'Valle de Uco':         { lat: -33.60, lng: -69.20, country: 'Argentina' },
  'Uco Valley':           { lat: -33.60, lng: -69.20, country: 'Argentina' },  // alias

  // SPAIN
  'Rioja':                { lat: 42.47, lng: -2.45, country: 'Spain' },
  'Priorat':              { lat: 41.20, lng: 0.75, country: 'Spain' },
  'Yecla':                { lat: 38.61, lng: -1.11, country: 'Spain' },

  // PORTUGAL
  'Douro Valley':         { lat: 41.16, lng: -7.80, country: 'Portugal' },
  'Douro':                { lat: 41.16, lng: -7.80, country: 'Portugal' },  // alias
  'Alentejano':           { lat: 38.57, lng: -7.91, country: 'Portugal' },

  // LEBANON
  'Bekaa Valley':         { lat: 33.85, lng: 35.90, country: 'Lebanon' },

  // NEW ZEALAND
  'Marlborough':          { lat: -41.52, lng: 173.95, country: 'New Zealand' },
  'Central Otago':        { lat: -45.03, lng: 169.20, country: 'New Zealand' },
  'Hawkes Bay':           { lat: -39.60, lng: 176.85, country: 'New Zealand' },

  // SOUTH AFRICA
  'Stellenbosch':         { lat: -33.93, lng: 18.86, country: 'South Africa' },
  'Swartland':            { lat: -33.45, lng: 18.75, country: 'South Africa' },

  // GERMANY
  'Mosel':                { lat: 49.97, lng: 6.73, country: 'Germany' },
  'Rheingau':             { lat: 50.02, lng: 8.05, country: 'Germany' },

  // DENMARK
  'Denmark':              { lat: 55.68, lng: 12.57, country: 'Denmark' },
}
