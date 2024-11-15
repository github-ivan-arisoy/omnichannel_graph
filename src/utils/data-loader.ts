import edges from '../data/edges1.csv?raw';
import metadata from '../data/metadata.csv?raw';

function parseCSV(csv: string): any[] {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, index) => {
      obj[header.trim()] = values[index].trim();
      return obj;
    }, {} as any);
  });
}

export function loadGraphData() {
  const nodes = parseCSV(metadata).map(node => ({
    ...node,
    size: 5, // Default size
    color: node.env === 'Household' ? '#88C6FF' : '#FF99D2' // Color based on environment
  }));

  const links = parseCSV(edges).map(link => ({
    ...link,
    width: 1, // Default width
    color: '#666666' // Default color
  }));

  return { nodes, links };
}