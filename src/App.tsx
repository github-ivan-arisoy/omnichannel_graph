// App.tsx
import { useState, useRef, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import {
  CosmographProvider,
  Cosmograph,
  CosmographHistogram,
  CosmographTimeline,
  CosmographSearch,
  CosmographRef,
  CosmographTimelineRef,
  CosmographSearchRef,
} from "@cosmograph/react";
import { nodes, links, Node, Link } from "./data";
import TeadsLogo from './TeadsLogo';
import "./style.css";

const DEVICE_COLORS = {
  'Household': '#F14B4B', // Red
  'User: LiverampID': '#8A2BE2',  // Purple
  'Phone': '#4B9BF1',    // Blue
  'PC': '#F1A74B',       // Orange
  'CTV': '#4BF1D2',      // Cyan
  'Tablet': '#7CF14B',   // Green

};

const App = () => {
  const cosmographRef = useRef<CosmographRef<Node, Link>>(null);
  const timelineRef = useRef<CosmographTimelineRef<Link>>(null); // Changed Node to Link
  const searchRef = useRef<CosmographSearchRef<Node>>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentView, setCurrentView] = useState<'general' | 'info' | 'analysis'>('analysis');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isTimelineAnimating, setIsTimelineAnimating] = useState(false);
  const [showLabelsFor, setShowLabelsFor] = useState<Node[] | undefined>(undefined); // Added state

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      cosmographRef.current?.pause();
    } else {
      cosmographRef.current?.restart();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setShowLabelsFor(undefined);
    cosmographRef.current?.unselectNodes();
    cosmographRef.current?.focusNode(undefined);
  }, []);

  const handleNodeClick = useCallback((node: Node | undefined) => {
    if (node) {
      setSelectedNode(node);
      setCurrentView('info'); // Activate Info tab
      setShowLabelsFor([node]); // Show label for selected node
      cosmographRef.current?.selectNode(node);
      cosmographRef.current?.focusNode(node);
    } else {
      clearSelection();
    }
  }, [clearSelection]);

  const handleSearchSelect = useCallback((node: Node) => {
    setSelectedNode(node);
    setCurrentView('info'); // Activate Info tab
    setShowLabelsFor([node]); // Show label for selected node
    cosmographRef.current?.selectNode(node);
    cosmographRef.current?.focusNode(node);
  }, []);

  const handleTimelineAnimationPlay = useCallback(() => {
    setIsTimelineAnimating(true);
  }, []);

  const handleTimelineAnimationPause = useCallback(() => {
    setIsTimelineAnimating(false);
  }, []);

  const handleTimelineSelection = useCallback((selection?: [Date, Date]) => {
    if (selection) {
      console.log('Timeline selection:', selection);
    }
  }, []);


  const getNodeColor = useCallback((node: Node) => {
    return DEVICE_COLORS[node.node_type as keyof typeof DEVICE_COLORS] || '#666666';
  }, []);

  const getNodeSize = useCallback((node: Node) => {
    const count = node.outLinksCount || 0;
    const k = 0.1; // Adjust this constant to control sensitivity
    // Exponential function to scale node size
    return 1.4 - Math.exp(-k * 3*(count+1)) ;
  }, []);



  // Legend component
  const Legend = () => (
    <div className="legend-container">
      <div className="legend-title">Node Types</div>
      {Object.entries(DEVICE_COLORS).map(([device, color]) => (
        <div key={device} className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: color }} />
          <span>{device}</span>
        </div>
      ))}
    </div>
  );

  return (
    <CosmographProvider<Node, Link> nodes={nodes} links={links}>
      <div className="app-container">
        {/* Top Navigation */}
        <div className="nav-container">
          <div className="nav-brand">
            <TeadsLogo />
            
          </div>
          <div className="nav-tabs">
            <button
              className={`nav-tab ${currentView === 'general' ? 'active' : ''}`}
              onClick={() => setCurrentView('general')}
            >
              General
            </button>
            <button
              className={`nav-tab ${currentView === 'info' ? 'active' : ''}`}
              onClick={() => setCurrentView('info')}
            >
              Info
            </button>
            <button
              className={`nav-tab ${currentView === 'analysis' ? 'active' : ''}`}
              onClick={() => setCurrentView('analysis')}
            >
              Analysis
            </button>
          </div>
          <div className="nav-actions">
            <CosmographSearch<Node, Link>
              ref={searchRef}
              className="search-input"
              accessors={[
                { label: 'ID', accessor: (node) => node.id },
                { label: 'Environment', accessor: (node) => node.env || '' },
                { label: 'IP Hash', accessor: (node) => node.ip_hash || '' },
                { label: 'Browser', accessor: (node) => node.browsers || '' },
                { label: 'Node type', accessor: (node) => node.node_type || '' },
                { label: 'City', accessor: (node) => node.cities || '' }
              ]}
              maxVisibleItems={5}
              placeholder="Search nodes..."
              onSelectResult={handleSearchSelect}
            />
            <button className="play-button" onClick={handlePlayPause}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="content-container">
          {/* Sidebar */}
          {(currentView === 'analysis' || currentView === 'info') && (
            <div className="sidebar">
              {/* Node Info Section */}
              {currentView === 'info' && selectedNode && (
                <div className="info-container">
                  <h3 className="info-title">Node Information</h3>
                  <div className="info-content">
                    <p>ID: {selectedNode.id}</p>
                    <p>Environment: {selectedNode.env}</p>
                    <p>IP Hash: {selectedNode.ip_hash}</p>
                    <p>Browser: {selectedNode.browsers}</p>
                    <p>Node type: {selectedNode.node_type}</p>
                    <p>Cities: {selectedNode.cities}</p>
                    <p>std Name: {selectedNode.standardised_name}</p>
                    <p>Incoming Links: {selectedNode.inLinksCount}</p>
                    <p>Outgoing Links: {selectedNode.outLinksCount}</p>
                    {/* Clear Selection Button */}
                    <button onClick={clearSelection}>Clear Selection</button>
                  </div>
                </div>
              )}

              {/* Histograms */}
              {currentView === 'analysis' && (
                <>
                  <div className="histogram-container">
                    <h3 className="histogram-title">Total Links</h3>
                    <CosmographHistogram<Node>
                      accessor={(node) => {
                        const inLinks = node.inLinksCount || 0;
                        const outLinks = node.outLinksCount || 0;
                        return inLinks + outLinks;
                      }}
                    />
                  </div>

                  <div className="histogram-container">
                    <h3 className="histogram-title">Incoming Links</h3>
                    <CosmographHistogram<Node>
                      accessor={(node) => node.inLinksCount || 0}
                    />
                  </div>

                  <div className="histogram-container">
                    <h3 className="histogram-title">Outgoing Links</h3>
                    <CosmographHistogram<Node>
                      accessor={(node) => node.outLinksCount || 0}
                    />
                  </div>

                  <div className="histogram-container">
                    <h3 className="histogram-title">Number of users associated with the node</h3>
                    <CosmographHistogram<Node>
                      accessor={(node) => node.nb_of_users || 0}
                    />
                  </div>

                  <div className="histogram-container">
                    <h3 className="histogram-title">Number of households associated with the node</h3>
                    <CosmographHistogram<Node>
                      accessor={(node) => node.nb_of_households || 0}
                    />
                  </div>

                  <div className="histogram-container">
                    <h3 className="histogram-title">Number of vids associated with the node</h3>
                    <CosmographHistogram<Node>
                      accessor={(node) => node.nb_of_vids || 0}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Graph Area */}
          <div className="graph-container">
            <Cosmograph
              ref={cosmographRef}
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
              simulationLinkDistance={10.0}
              simulationFriction={0.2}
              
              
              simulationRepulsionFromMouse={0.1}
              simulationDecay={10000}
              nodeSizeScale={6}

              linkWidthScale={1.5}
              linkGreyoutOpacity= {0.2}


              spaceSize={8192}
              onClick={handleNodeClick}
              showHoveredNodeLabel={true}
              nodeLabelAccessor={(node) => node.node_type}
              showLabelsFor={showLabelsFor}
            />
            <Legend />
          </div>

          {/* Timeline */}
          <div className="timeline-container">
            <CosmographTimeline<Link> // Changed Node to Link
              ref={timelineRef}
              showAnimationControls
              animationSpeed={50}
              accessor={(link: Link) => new Date(link.time)}
              filterType="links"
              onAnimationPlay={handleTimelineAnimationPlay}
              onAnimationPause={handleTimelineAnimationPause}
              onSelection={handleTimelineSelection}
            />
          </div>

          {/* Stats Display */}
          <div className="stats-container">
            <div>{nodes.length.toLocaleString()} Nodes</div>
            <div>{links.length.toLocaleString()} Links</div>
          </div>
        </div>
      </div>
    </CosmographProvider>
  );
};

export default App;