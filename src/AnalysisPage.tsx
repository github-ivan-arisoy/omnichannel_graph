// AnalysisPage.tsx
import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGraph } from './GraphContext';
import { CosmographProvider, Cosmograph } from '@cosmograph/react';
import { Node, Link } from './data';
import { AgeDistribution, DeviceDistribution } from './D3Visualizations';
import TeadsLogo from './TeadsLogo';

interface AnalysisPageState {
  selectedHouseholds: Node[];
  relatedNodes: Node[];
  links: Link[];
  deviceColors: Record<string, string>;
}

export function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { deviceColors } = useGraph();

  const state = location.state as AnalysisPageState;

  // If no state was passed, redirect to main page
  if (!state) {
    React.useEffect(() => {
      navigate('/', { replace: true });
    }, [navigate]);
    return null;
  }

  const { selectedHouseholds, relatedNodes, links } = state;

  // Get all connected user nodes
  const connectedUsers = relatedNodes.filter((node: Node) => 
    node.node_type.startsWith('User:') && 
    node.age_predictions && 
    node.age_predictions !== '-'
  );

  // Get connected VIDs
  const connectedVIDs = relatedNodes.filter((node: Node) => 
    node.node_type === 'Phone'
  );

  const handleReturnToGraph = useCallback(() => {
    navigate('/', {
      state: {
        returnedFromAnalysis: true,
        selectedHouseholds,
        relatedNodes,
        links
      }
    });
  }, [navigate, selectedHouseholds, relatedNodes, links]);

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
      <div className="nav-container">
        <div className="nav-brand">
          <TeadsLogo />
        </div>
        <div className="nav-tabs">
          <button
            className="nav-tab"
            onClick={handleReturnToGraph}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Return to Graph
          </button>
          <div className="selected-info">
            Analyzing {selectedHouseholds.length} households
          </div>
        </div>
        <div className="nav-actions">
          {/* You can add additional actions here if needed */}
        </div>
      </div>
      
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