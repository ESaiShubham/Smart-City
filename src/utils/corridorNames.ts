// Rich Hyderabad Corridor Names and Zone Mapping for all 436 segments

const HYDERABAD_ZONES = [
  'Cyberabad / Hitec City',
  'Gachibowli / Financial District',
  'Banjara Hills & Jubilee Hills',
  'Punjagutta & Begumpet',
  'Secunderabad & Paradise',
  'Mehdipatnam & PVNR Radial',
  'Kukatpally & Miyapur',
  'Old City & Charminar',
  'Dilsukhnagar & LB Nagar',
  'Kondapur & Madhapur',
];

const CORRIDOR_NAME_TEMPLATES = [
  'Outer Ring Rd Expressway (Gachibowli)',
  'Hitec City Cyber Towers Link',
  'PV Narasimha Rao Expressway',
  'Gachibowli Flyover Arterial',
  'Banjara Hills Rd No. 12',
  'Jubilee Hills Checkpost Arterial',
  'Madhapur Metro Corridor',
  'Kukatpally Y Junction Radial',
  'Punjagutta Central Flyover',
  'Begumpet Airport Arterial',
  'Financial District Radial (Nanakramguda)',
  'Kondapur Botanical Garden Rd',
  'Mehdipatnam Ring Rd',
  'Secunderabad Station Arterial',
  'Dilsukhnagar Highway Link',
  'Charminar Heritage Corridor',
  'Gachibowli - Miyapur Link',
  'Nanakramguda Circle Radial',
  'Tolichowki Flyover Arterial',
  'Miyapur X Roads Highway',
  'Sanathnagar Industrial Radial',
  'Amberpet Main Road',
  'Somajiguda Raj Bhavan Rd',
  'Masab Tank Radial',
  'Abids Commercial Corridor',
  'Kothaguda Junction Link',
  'Raidurgam Mindspace Arterial',
  'Gachibowli Stadium Link',
  'Paradise Circle Arterial',
  'Tarnaka University Corridor',
];

const NAMED_CORRIDORS: Record<string, { name: string; zone: string }> = {
  R17: { name: 'Cyber Towers - Mindspace Arterial (Hitec City)', zone: 'Cyberabad / Hitec City' },
  R18: { name: 'Gachibowli ORR Radial (Wipro Circle - Financial Dist)', zone: 'Gachibowli / Financial District' },
  R19: { name: 'Biodiversity Park - Knowledge City Bypass', zone: 'Cyberabad / Hitec City' },
  R21: { name: 'Raidurg Metro Underpass (Inorbit Mall Link)', zone: 'Cyberabad / Hitec City' },
  R16: { name: 'IKEA - HITEC City Station Radial', zone: 'Cyberabad / Hitec City' },
  R08: { name: 'Durgam Cheruvu Cable Bridge Corridor (Jubilee Hills Rd 45)', zone: 'Banjara Hills & Jubilee Hills' },
  R01: { name: 'PVNR Expressway (Mehdipatnam - Rajiv Gandhi Airport)', zone: 'Mehdipatnam & PVNR Radial' },
  R02: { name: 'Gachibowli Stadium - IIIT Hyderabad Junction', zone: 'Gachibowli / Financial District' },
  R03: { name: 'Kondapur - Botanical Garden Road', zone: 'Kondapur & Madhapur' },
  R04: { name: 'Madhapur Metro - Jubilee Hills Checkpost', zone: 'Banjara Hills & Jubilee Hills' },
  R05: { name: 'Banjara Hills Rd No. 12 - Panjagutta Flyover', zone: 'Banjara Hills & Jubilee Hills' },
  R06: { name: 'Begumpet - Secunderabad Paradise Circle', zone: 'Secunderabad & Paradise' },
  R07: { name: 'Kukatpally Y Junction - JNTU Highway', zone: 'Kukatpally & Miyapur' },
  R09: { name: 'Charminar - Nayapul Old City Heritage Route', zone: 'Old City & Charminar' },
  R0360: { name: 'PVNR Expressway Radial (Mehdipatnam Pillar 140)', zone: 'Mehdipatnam & PVNR Radial' },
  R0384: { name: 'Gachibowli - Hitec City Outer Link', zone: 'Gachibowli / Financial District' },
  R0006: { name: 'Madhapur Mindspace IT Corridor', zone: 'Cyberabad / Hitec City' },
  R0078: { name: 'Jubilee Hills Road No. 36 Arterial', zone: 'Banjara Hills & Jubilee Hills' },
  R0168: { name: 'Financial District North Bypass Link', zone: 'Gachibowli / Financial District' },
};

/**
 * Returns a human-friendly corridor name and zone for any segment ID and coordinates
 */
export function getCorridorInfo(segmentId: string, _lat?: number, _lon?: number): { name: string; zone: string } {
  // Normalize segment ID e.g. R0017 -> R17
  const cleanId = segmentId.replace(/^R0+/, 'R');
  if (NAMED_CORRIDORS[cleanId]) {
    return NAMED_CORRIDORS[cleanId];
  }
  if (NAMED_CORRIDORS[segmentId]) {
    return NAMED_CORRIDORS[segmentId];
  }

  // Derive stable hash from segment ID
  let hash = 0;
  for (let i = 0; i < segmentId.length; i++) {
    hash = (hash * 31 + segmentId.charCodeAt(i)) % 100000;
  }

  const nameIndex = Math.abs(hash) % CORRIDOR_NAME_TEMPLATES.length;
  const zoneIndex = Math.abs(hash * 7) % HYDERABAD_ZONES.length;

  const baseName = CORRIDOR_NAME_TEMPLATES[nameIndex];
  const zone = HYDERABAD_ZONES[zoneIndex];
  const subSec = ((Math.abs(hash) % 8) + 1);

  return {
    name: `${baseName} (Sec ${subSec})`,
    zone,
  };
}
