import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Node, Link } from './data';

interface SelectedHouseholdsProps {
  selectedHouseholds: Node[];
  onRemove: (household: Node) => void;
  graphData: { nodes: Node[]; links: Link[] };
  deviceColors: Record<string, string>;  // Add this line
}

export function SelectedHouseholds({ 
  selectedHouseholds, 
  onRemove,
  graphData,
  deviceColors  // Add this parameter
}: SelectedHouseholdsProps) {
  const navigate = useNavigate();

  if (!selectedHouseholds?.length) return null;
  if (!graphData) return null;

  const handleAnalyze = () => {
    const householdIds = new Set(selectedHouseholds.map(h => h.id));
    const relevantLinks = graphData.links.filter(link => 
      householdIds.has(link.source) || householdIds.has(link.target)
    );
    
    const connectedNodeIds = new Set([
      ...relevantLinks.map(l => l.source),
      ...relevantLinks.map(l => l.target)
    ]);
    
    const relatedNodes = graphData.nodes.filter(
      node => !householdIds.has(node.id) && connectedNodeIds.has(node.id)
    );
  
    // Pass deviceColors along with other state
    navigate('/analysis', {
      state: {
        selectedHouseholds,
        relatedNodes,
        links: relevantLinks,
        deviceColors // Pass the current deviceColors
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
      >
        Analyze
      </button>
    </div>
  );
}

export default SelectedHouseholds;