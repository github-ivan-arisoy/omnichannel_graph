import { useState, useRef, useCallback, useEffect } from "react";
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
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Node, Link, loadGraphData, getDatasets } from "./data";
import { DatasetInfo } from './types';
import TeadsLogo from './TeadsLogo';
import SelectedHouseholds from './SelectedHouseholds';
import AnalysisPage from './AnalysisPage';
import "./style.css";

interface RouterState {
  selectedHouseholds: Node[];
  relatedNodes: Node[];
  links: Link[];
  deviceColors: Record<string, string>;
}


function MainPage() {
  
  const cosmographRef = useRef<CosmographRef<Node, Link>>(null);
  const timelineRef = useRef<CosmographTimelineRef<Link>>(null);
  const searchRef = useRef<CosmographSearchRef<Node>>(null);

  const [selectedHouseholds, setSelectedHouseholds] = useState<Node[]>([]);

  // State
  const [datasets, setDatasets] = useState<Record<string, DatasetInfo>>({});
  const [currentDataset, setCurrentDataset] = useState<string>('');
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: Link[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentView, setCurrentView] = useState<'general' | 'info' | 'analysis'>('analysis');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isTimelineAnimating, setIsTimelineAnimating] = useState(false);
  const [showLabelsFor, setShowLabelsFor] = useState<Node[] | undefined>(undefined);
  const [deviceColors, setDeviceColors] = useState<Record<string, string>>({});
  const [isHouseholdsOpen, setIsHouseholdsOpen] = useState(true);
  const [isUsersOpen, setIsUsersOpen] = useState(true);
  const [isVIDsOpen, setIsVIDsOpen] = useState(true);

  // Load datasets
  useEffect(() => {
    const loadDatasets = async () => {
      const datasetsList = await getDatasets();
      setDatasets(datasetsList);
      // Set default dataset if not already selected
      if (!currentDataset && Object.keys(datasetsList).length > 0) {
        setCurrentDataset(Object.keys(datasetsList)[0]);
      }
    };
    loadDatasets();
  }, []);

  // Load graph data when currentDataset changes
  useEffect(() => {
    if (currentDataset) {
      const loadData = async () => {
        setLoading(true);
        try {
          const data = await loadGraphData(currentDataset);
          setGraphData(data);
          // Reset selections when dataset changes
          setSelectedNode(null);
          setShowLabelsFor(undefined);

          // Generate color mapping for node types
          const uniqueNodeTypes = Array.from(new Set(data.nodes.map(node => node.node_type)));
          const colors = generateColorMapping(uniqueNodeTypes);
          setDeviceColors(colors);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [currentDataset]);

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

  const handleTimelineSelection = useCallback((
    selection?: [Date, Date] | [number, number],
    isManuallySelected?: boolean
  ) => {
    if (selection && selection[0] instanceof Date) {
      console.log('Timeline selection:', selection);
    }
  }, []);

  const getNodeColor = useCallback((node: Node) => {
    return deviceColors[node.node_type] || '#666666';
  }, [deviceColors]);

  const getNodeSize = useCallback((node: Node) => {
    const count = node.outLinksCount || 0;
    const k = 0.1; // Adjust this constant to control sensitivity
    // Exponential function to scale node size
    return 1.4 - Math.exp(-k * 3*(count+1)) ;
  }, []);



  // Legend component
  const Legend = () => (
    <div className="legend-container relative">
      <div className="flex items-start justify-between">
        <div>
          <div className="legend-title">Node Types</div>
          {Object.entries(deviceColors).map(([type, color]) => (
            <div key={type} className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: color }} />
              <span>{type}</span>
            </div>
          ))}
          {selectedNode?.node_type === 'Household' && (
            <button
              onClick={() => {
                if (selectedNode && !selectedHouseholds.find(h => h.id === selectedNode.id)) {
                  setSelectedHouseholds(prev => [...prev, selectedNode]);
                }
              }}
              className="add-household-button"
            >
              + Add Selected Household
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const generateColorMapping = (types: string[]) => {
    const predefinedColors: string[] = [
      '#F14B4B', // Red
      '#8A2BE2', // Purple
      '#4B9BF1', // Blue
      '#F1A74B', // Orange
      '#4BF1D2', // Cyan
      '#7CF14B', // Green
      // Add more colors if needed
    ];
    const colorMapping: Record<string, string> = {};
    types.forEach((type, index) => {
      colorMapping[type] = predefinedColors[index % predefinedColors.length];
    });
    return colorMapping;
  };

    // Show loading state
    if (!graphData || loading) {
      return (
        <div className="loading">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div>Loading dataset...</div>
          </div>
        </div>
      );
    }



  

  return (
    <CosmographProvider nodes={graphData.nodes} links={graphData.links}>
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
          <SelectedHouseholds
            selectedHouseholds={selectedHouseholds}
            onRemove={(household) => {
              setSelectedHouseholds(prev => prev.filter(h => h.id !== household.id));
            }}
            graphData={graphData}
            deviceColors={deviceColors}  // Add this line
          />
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
          {(currentView === 'general' || currentView === 'info' || currentView === 'analysis') && (
            <div className="sidebar">
              {/* General Tab Sidebar */}
              {currentView === 'general' && (
                <div className="general-sidebar">
                  <h3 className="sidebar-title">Select Dataset</h3>
                  <div className="dataset-menu">
                    {Object.entries(datasets).map(([key, dataset]) => (
                      <button
                        key={key}
                        className={`dataset-button ${currentDataset === key ? 'active' : ''}`}
                        onClick={() => setCurrentDataset(key)}
                      >
                        {dataset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                  {/* Households Histograms */}
                  <h2 onClick={() => setIsHouseholdsOpen(!isHouseholdsOpen)} className="collapsible-header">
                    Households {isHouseholdsOpen ? '▲' : '▼'}
                  </h2>
                  {isHouseholdsOpen && (
                    <>
                      {/* Histogram for household_nb_of_users */}
                      <div className="histogram-container">
                        <h3 className="histogram-title">Number of Users by Household</h3>
                        <CosmographHistogram<Node>
                          accessor={(node) => Math.max(node.household_nb_of_users || 0, 0)}
                        />
                      </div>

                      {/* Histogram for household_nb_of_vids */}
                      <div className="histogram-container">
                        <h3 className="histogram-title">Number of VIDs by Household</h3>
                        <CosmographHistogram<Node>
                          accessor={(node) => Math.max(node.household_nb_of_vids || 0, 0)}
                        />
                      </div>
                    </>
                  )}

                  {/* Users Histograms */}
                  <h2 onClick={() => setIsUsersOpen(!isUsersOpen)} className="collapsible-header">
                    Users {isUsersOpen ? '▲' : '▼'}
                  </h2>
                  {isUsersOpen && (
                    <>
                      {/* Histogram for user_nb_of_households */}
                      <div className="histogram-container">
                        <h3 className="histogram-title">Number of Households by User</h3>
                        <CosmographHistogram<Node>
                          accessor={(node) => Math.max(node.user_nb_of_households || 0, 0)}
                        />
                      </div>

                      {/* Histogram for user_nb_of_vids */}
                      <div className="histogram-container">
                        <h3 className="histogram-title">Number of VIDs by User</h3>
                        <CosmographHistogram<Node>
                          accessor={(node) => Math.max(node.user_nb_of_vids || 0, 0)}
                        />
                      </div>
                    </>
                  )}

                  {/* VIDs Histograms */}
                  <h2 onClick={() => setIsVIDsOpen(!isVIDsOpen)} className="collapsible-header">
                    VIDs {isVIDsOpen ? '▲' : '▼'}
                  </h2>
                  {isVIDsOpen && (
                    <>
                      {/* Histogram for vid_nb_of_users */}
                      <div className="histogram-container">
                        <h3 className="histogram-title">Number of Users by VID</h3>
                        <CosmographHistogram<Node>
                          accessor={(node) => Math.max(node.vid_nb_of_users || 0, 0)}
                        />
                      </div>

                      {/* Histogram for vid_nb_of_households */}
                      <div className="histogram-container">
                        <h3 className="histogram-title">Number of Households by VID</h3>
                        <CosmographHistogram<Node>
                          accessor={(node) => Math.max(node.vid_nb_of_households || 0, 0)}
                        />
                      </div>
                    </>
                  )}
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
              simulationLinkDistance={3.0}
              simulationFriction={0.2}
              
              
              simulationRepulsionFromMouse={0.1}
              simulationDecay={10000}
              nodeSizeScale={4}

              linkWidthScale={1}
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
            <div>{graphData.nodes.length.toLocaleString()} Nodes</div>
            <div>{graphData.links.length.toLocaleString()} Links</div>
          </div>
        </div>
      </div>
    </CosmographProvider>
  );
};



const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;


