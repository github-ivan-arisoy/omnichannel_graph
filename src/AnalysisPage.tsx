import React, { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { CosmographProvider, Cosmograph } from '@cosmograph/react';
import { Node, Link } from './data';
import { AgeDistribution, DeviceDistribution } from './D3Visualizations';

interface AnalysisPageState {
  selectedHouseholds: Node[];
  relatedNodes: Node[];
  links: Link[];
  deviceColors: Record<string, string>;
}

export function AnalysisPage() {
  const location = useLocation();
  const { selectedHouseholds, relatedNodes, links, deviceColors } = location.state as AnalysisPageState;

  // Get all connected user nodes
  const connectedUsers = relatedNodes.filter((node: Node) => 
    node.node_type.startsWith('User:') && 
    node.age_predictions && 
    node.age_predictions !== '-'
  );

  // Move connectedVIDs inside the function
  const connectedVIDs = relatedNodes.filter((node: Node) => 
    node.node_type === 'Phone' // Adjust this based on your actual node_type for VIDs
  );

  const getNodeColor = useCallback((node: Node) => {
    return deviceColors[node.node_type] || '#666666';
  }, [deviceColors]);

  const getNodeSize = useCallback((node: Node) => {
    const count = node.outLinksCount || 0;
    const k = 0.1;
    return 1.4 - Math.exp(-k * 3 * (count + 1));
  }, []);

  return (
    <div className="analysis-page">
      <header className="analysis-header">
        <h1>Household Analysis</h1>
        <div className="household-count">
          Analyzing {selectedHouseholds.length} households
        </div>
      </header>
      
      <div className="analysis-content">
        <div className="graph-section">
          <CosmographProvider
            nodes={[...selectedHouseholds, ...relatedNodes]}
            links={links}
          >
            <Cosmograph
              backgroundColor="#06172C"
              nodeColor={getNodeColor}
              nodeSize={getNodeSize}
              linkWidth={1}
              linkColor="rgba(102, 102, 102, 0.3)"
              curvedLinks={false}
              fitViewOnInit
              linkArrows={false}
              simulationGravity={1}
              simulationRepulsion={10}
              simulationRepulsionTheta={1.5}
              simulationLinkDistance={3.0}
              simulationFriction={0.2}
              simulationRepulsionFromMouse={0.1}
              simulationDecay={10000}
              nodeSizeScale={4}
              linkWidthScale={1}
              linkGreyoutOpacity={0.2}
              spaceSize={8192}
              showHoveredNodeLabel={true}
              nodeLabelAccessor={(node) => node.node_type}
            />
          </CosmographProvider>
        </div>
        
        <div className="d3-section">
          <AgeDistribution users={connectedUsers} />
          <DeviceDistribution vids={connectedVIDs} />
        </div>
      </div>
    </div>
  );
}

export default AnalysisPage;