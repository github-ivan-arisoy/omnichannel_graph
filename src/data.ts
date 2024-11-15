//import edges from './data/edges-MX-Id5.csv?raw';
//import metadata from './data/metadata-MX-Id5.csv?raw';

import edges from './data/edges-US-liveramp.csv?raw';
import metadata from './data/metadata-US-liveramp.csv?raw';

export interface Node {
  id: string;
  env: string;
  ip_hash: string;
  browsers: string;
  node_type: string;  // Changed from ua_devices
  cities: string;
  standardised_name: string;
  nb_of_households: number;
  nb_of_users: number;
  nb_of_vids: number;
  size?: number;
  color?: string;
  inLinksCount?: number;
  outLinksCount?: number;
}

export interface Link {
  source: string;
  target: string;
  time: string;
  relationship: string;
  width?: number;
  color?: string;
}

function parseCSV(csv: string): any[] {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, index) => {
      const value = values[index]?.trim() || '';
      // Convert numeric strings to numbers
      if (['nb_of_households', 'nb_of_users', 'nb_of_vids'].includes(header)) {
        obj[header] = parseFloat(value) || 0;
      } else {
        obj[header] = value;
      }
      return obj;
    }, {} as any);
  });
}

export function loadGraphData() {
  const nodesArray = parseCSV(metadata);
  const linksArray = parseCSV(edges);

  // Create a Map to store nodes by id
  const nodesMap = new Map<string, Node>();
  nodesArray.forEach(node => {
    node.size = 5;
    // Default color will be set by the component based on node_type
    node.inLinksCount = 0;
    node.outLinksCount = 0;
    nodesMap.set(node.id, node);
  });

  // Update inLinksCount and outLinksCount for each node
  linksArray.forEach(link => {
    link.width = 1;
    link.color = '#666666';

    const sourceNode = nodesMap.get(link.source);
    const targetNode = nodesMap.get(link.target);

    if (sourceNode) {
      sourceNode.outLinksCount! += 1;
    }

    if (targetNode) {
      targetNode.inLinksCount! += 1;
    }
  });

  const nodes = Array.from(nodesMap.values());
  const links = linksArray;

  return { nodes, links };
}

export const { nodes, links } = loadGraphData();