
import { useNavigate } from 'react-router-dom';
import { Node, Link } from './data';

interface SelectedHouseholdsProps {
  selectedHouseholds: Node[];
  onRemove: (household: Node) => void;
  graphData: { nodes: Node[]; links: Link[] };
  deviceColors: Record<string, string>;
}

// Add the network traversal function
const getCompleteNetwork = (
  selectedHouseholds: Node[],
  allNodes: Node[],
  allLinks: Link[]
): { nodes: Node[]; links: Link[] } => {
  const includedNodeIds = new Set<string>();
  const includedLinks = new Set<Link>();
  
  selectedHouseholds.forEach(h => includedNodeIds.add(h.id));

  const exploreConnections = (nodeId: string) => {
    allLinks.forEach(link => {
      if (link.source === nodeId || link.target === nodeId) {
        const otherNodeId = link.source === nodeId ? link.target : link.source;
        const otherNode = allNodes.find(n => n.id === otherNodeId);
        
        if (!otherNode) return;

        includedLinks.add(link);

        if (!includedNodeIds.has(otherNodeId)) {
          includedNodeIds.add(otherNodeId);

          if (otherNode.node_type.startsWith('User:') || 
              (otherNode.node_type !== 'Household' && otherNode.node_type !== 'User: LiverampID')) {
            exploreConnections(otherNodeId);
          }
        }
      }
    });
  };

  selectedHouseholds.forEach(household => {
    exploreConnections(household.id);
  });

  const nodes = allNodes.filter(node => includedNodeIds.has(node.id));
  const links = Array.from(includedLinks);

  return { nodes, links };
};

export function SelectedHouseholds({ 
  selectedHouseholds, 
  onRemove,
  graphData,
  deviceColors
}: SelectedHouseholdsProps) {
  const navigate = useNavigate();

  if (!selectedHouseholds?.length) return null;
  if (!graphData) return null;

  const handleAnalyze = () => {
    const { nodes: relatedNodes, links } = getCompleteNetwork(
      selectedHouseholds,
      graphData.nodes,
      graphData.links
    );

    navigate('/analysis', {
      state: {
        selectedHouseholds,
        relatedNodes,
        links,
        deviceColors
      }
    });
  };

  return (
    <div className="selected-households">
      {selectedHouseholds.map((household) => (
        <div key={household.id} className="selected-household-item">
          <span className="household-label">
            {String(household.id).substring(0, 8)}...
          </span>
          <button
            onClick={() => onRemove(household)}
            className="household-remove"
          >
            ×
          </button>
        </div>
      ))}
      <button 
        onClick={handleAnalyze}
        className="analyze-button"
        disabled={selectedHouseholds.length === 0}
      >
        Analyze
      </button>
    </div>
  );
}

export default SelectedHouseholds;