// GraphContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { Node, Link } from './data';
import { DatasetInfo } from './types';

interface GraphContextType {
  datasets: Record<string, DatasetInfo>;
  currentDataset: string;
  graphData: { nodes: Node[]; links: Link[] } | null;
  deviceColors: Record<string, string>;
  setDatasets: (datasets: Record<string, DatasetInfo>) => void;
  setCurrentDataset: (dataset: string) => void;
  setGraphData: (data: { nodes: Node[]; links: Link[] } | null) => void;
  setDeviceColors: (colors: Record<string, string>) => void;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

function GraphProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Record<string, DatasetInfo>>({});
  const [currentDataset, setCurrentDataset] = useState<string>('');
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: Link[] } | null>(null);
  const [deviceColors, setDeviceColors] = useState<Record<string, string>>({});

  return (
    <GraphContext.Provider 
      value={{
        datasets,
        currentDataset,
        graphData,
        deviceColors,
        setDatasets,
        setCurrentDataset,
        setGraphData,
        setDeviceColors
      }}
    >
      {children}
    </GraphContext.Provider>
  );
}

function useGraph() {
  const context = useContext(GraphContext);
  if (context === undefined) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return context;
}

export { GraphProvider, useGraph };