//import edges from './data/edges-MX-Id5.csv?raw';
//import metadata from './data/metadata-MX-Id5.csv?raw';

//import edges from './data/edges-US-liveramp.csv?raw';
//import metadata from './data/metadata-US-liveramp.csv?raw';

import { DatasetInfo } from './types';

// Removed import of DATASETS
//add domain,context_name,ts,age_predictions,
export interface Node {
  id: string;
  env: string;
  ip_hash: string;
  browsers: string;
  node_type: string;
  cities: string;
  standardised_name: string;
  nb_of_households: number;
  nb_of_users: number;
  nb_of_vids: number;
  vid_nb_of_users: number;
  vid_nb_of_households: number;
  user_nb_of_vids: number;
  user_nb_of_households: number;
  household_nb_of_vids: number;
  household_nb_of_users: number;
  domain: string;
  context_name: string;
  age_predictions: string;
  ts: string;
  // Optional properties
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
  // Split by newlines but handle quoted fields containing newlines
  const parseLines = (text: string) => {
    const lines = [];
    let currentLine = '';
    let insideQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      }
      if (char === '\n' && !insideQuotes) {
        lines.push(currentLine);
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  const parseArrayString = (str: string): number[] => {
    try {
      // Remove brackets, handle both scientific and regular notation
      const cleanedString = str
        .replace('[', '')
        .replace(']', '')
        .trim();
        
      return cleanedString
        .split(/\s+/)
        .map(str => {
          // Handle scientific notation and regular numbers
          const num = parseFloat(str);
          return isNaN(num) ? 0 : num;
        })
        .filter(num => !isNaN(num));
    } catch (error) {
      console.error('Error parsing array string:', str);
      return [];
    }
  };

  const lines = parseLines(csv.trim());
  const headers = lines[0].split(',').map(h => h.trim())


  // Map CSV headers to property names
  const headerMapping: { [key: string]: string } = {
    'nb_of_households': 'nb_of_households',
    'nb_of_users': 'nb_of_users',
    'nb_of_vids': 'nb_of_vids',
    'vid_nb_of_users': 'vid_nb_of_users',
    'vid_nb_of_households': 'vid_nb_of_households',
    'user_nb_of_vids': 'user_nb_of_vids',
    'user_nb_of_households': 'user_nb_of_households',
    'household_nb_of_vids': 'household_nb_of_vids',
    'household_nb_of_users': 'household_nb_of_users',
    'domain': 'domain',
    'context_name': 'context_name',
    
  };

  const numberFields = [
    'nb_of_households',
    'nb_of_users',
    'nb_of_vids',
    'vid_nb_of_users',
    'vid_nb_of_households',
    'user_nb_of_vids',
    'user_nb_of_households',
    'household_nb_of_vids',
    'household_nb_of_users',
  ];

  return lines.slice(1).map(line => {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    // Parse CSV values handling quoted fields
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }
      if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    return headers.reduce((obj, header, index) => {
      let value = values[index] || '';
      
      // Handle array fields
      if (value.startsWith('[') && value.endsWith(']')) {
        obj[header] = parseArrayString(value);
      } 
      // Handle numeric fields
      else if (!isNaN(Number(value)) && value !== '') {
        obj[header] = Number(value);
      } 
      // Handle other fields
      else {
        obj[header] = value;
      }
      
      return obj;
    }, {} as any);
  });
}

const edgesFiles = import.meta.glob('./data/*/edges*.csv', { as: 'raw' });
const metadataFiles = import.meta.glob('./data/*/metadata*.csv', { as: 'raw' });

export async function getDatasets(): Promise<Record<string, DatasetInfo>> {
  const datasets: Record<string, DatasetInfo> = {};

  for (const path in metadataFiles) {
    const match = path.match(/\.\/data\/([^/]+)\/metadata.*\.csv$/);
    if (match) {
      const datasetName = match[1];
      datasets[datasetName] = {
        id: datasetName,
        name: datasetName,
        metadataFile: path,
        edgesFile: '', // Placeholder, will set below
      };
    }
  }

  for (const path in edgesFiles) {
    const match = path.match(/\.\/data\/([^/]+)\/edges.*\.csv$/);
    if (match) {
      const datasetName = match[1];
      if (datasets[datasetName]) {
        datasets[datasetName].edgesFile = path;
      }
    }
  }

  return datasets;
}

export async function loadGraphData(datasetName: string) {
  const datasets = await getDatasets();
  const dataset = datasets[datasetName];
  if (!dataset) {
    throw new Error(`Dataset ${datasetName} not found`);
  }

  const edgesModule = await import(/* @vite-ignore */ `${dataset.edgesFile}?raw`);
  const metadataModule = await import(/* @vite-ignore */ `${dataset.metadataFile}?raw`);

  const nodesArray = parseCSV(metadataModule.default);
  const linksArray = parseCSV(edgesModule.default);

  // Create a Map to store nodes by id
  const nodesMap = new Map<string, Node>();
  nodesArray.forEach(node => {
    node.size = 5;
    node.inLinksCount = 0;
    node.outLinksCount = 0;
    nodesMap.set(node.id, node);
  });

  // Update inLinksCount and outLinksCount for each node
  linksArray.forEach(link => {
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

// Removed getInitialData function as it's no longer needed