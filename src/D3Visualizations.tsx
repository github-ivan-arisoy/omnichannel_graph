import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Node } from './data';

interface AgeDistributionProps {
  users: Node[];
}

interface DeviceDistributionProps {
  vids: Node[];
}

export function AgeDistribution({ users }: AgeDistributionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [processedData, setProcessedData] = useState<Map<string, number[]>>(new Map());

  // Process user data once
  useEffect(() => {
    const newProcessedData = new Map<string, number[]>();
    
    users.forEach((user) => {
      try {
        let predictions: number[] = [];
        if (Array.isArray(user.age_predictions)) {
          predictions = user.age_predictions;
        } else if (typeof user.age_predictions === 'string' && user.age_predictions !== '-') {
          const cleanedString = user.age_predictions
            .replace(/[\[\]]/g, '')
            .trim();

          predictions = cleanedString
            .split(/\s+/)
            .map(str => parseFloat(str))
            .filter(num => !isNaN(num));
        }

        if (predictions.length > 0) {
          newProcessedData.set(user.id, predictions);
        }
      } catch (error) {
        console.error('Error processing user:', user.id, error);
      }
    });

    setProcessedData(newProcessedData);
    // Initially select first 3 users if available
    setSelectedUsers(new Set([...newProcessedData.keys()].slice(0, 3)));
  }, [users]);

  // Draw visualization
  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const ageRanges = [
      'Male 13-17',
      'Male 18-20',
      'Male 21-24',
      'Male 25-29',
      'Male 30-34',
      'Male 35-39',
      'Male 40-44',
      'Male 45-49',
      'Male 50-54',
      'Male 55-64',
      'Male 65+',
      'Female 13-17',
      'Female 18-20',
      'Female 21-24',
      'Female 25-29',
      'Female 30-34',
      'Female 35-39',
      'Female 40-44',
      'Female 45-49',
      'Female 50-54',
      'Female 55-64',
      'Female 65+'
    ]

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create scales
    const x = d3.scaleBand()
      .range([margin.left, width - margin.right])
      .domain(ageRanges)
      .padding(0.1);

    const y = d3.scaleLinear()
      .range([height - margin.bottom, margin.top])
      .domain([0, 1]); // Probabilities are between 0 and 1

    // Color scale for different users
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const createSafeId = (id: string): string => {
      return `user-${id.replace(/[^a-zA-Z0-9]/g, '-')}`;
    };

    // Draw bars for each selected user
    selectedUsers.forEach((userId, index) => {
      const userData = processedData.get(userId);
      if (!userData) return;

      const safeId = createSafeId(userId);  // Create safe class name

      svg.selectAll(`.${safeId}`)  // Use safe class name
        .data(userData)
        .enter()
        .append('rect')
        .attr('class', `bar-${userId}`)
        .attr('x', (d, i) => x(ageRanges[i])!)
        .attr('y', d => y(d))
        .attr('width', x.bandwidth())
        .attr('height', d => height - margin.bottom - y(d))
        .attr('fill', colorScale(index.toString()))
        .attr('opacity', 0.5);
    });

    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('fill', 'white');

    // Add y-axis
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('fill', 'white');

  }, [selectedUsers, processedData]);

  return (
    <div className="age-distribution">
      <h3>Age Distribution</h3>
      <div className="user-selection">
        <div className="selected-users">
          {Array.from(processedData.keys()).map((userId) => (
            <button
              key={userId}
              className={`user-button ${selectedUsers.has(userId) ? 'selected' : ''}`}
              onClick={() => {
                const newSelected = new Set(selectedUsers);
                if (newSelected.has(userId)) {
                  newSelected.delete(userId);
                } else {
                  newSelected.add(userId);
                }
                setSelectedUsers(newSelected);
              }}
            >
              {userId.substring(0, 8)}...
            </button>
          ))}
        </div>
        <div className="selection-controls">
          <button
            onClick={() => setSelectedUsers(new Set(processedData.keys()))}
          >
            Select All
          </button>
          <button
            onClick={() => setSelectedUsers(new Set())}
          >
            Clear All
          </button>
        </div>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
}


export function DeviceDistribution({ vids }: DeviceDistributionProps) {
  console.log('Received vids:', vids);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedVids, setSelectedVids] = useState<Set<string>>(new Set());
  const [deviceCounts, setDeviceCounts] = useState<Map<string, number>>(new Map());

  // Process VID data once
  useEffect(() => {
    const counts = new Map<string, number>();

    vids.forEach((vid) => {
      const deviceName = vid.standardised_name || 'Unknown';
      counts.set(deviceName, (counts.get(deviceName) || 0) + 1);
    });

    setDeviceCounts(counts);
    setSelectedVids(new Set(counts.keys()));
  }, [vids]);

  // Draw visualization
  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).selectAll('*').remove();

    // Log to verify useEffect is running
  console.log('Drawing Device Distribution Chart');

    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 80, left: 50 };

    const data = Array.from(deviceCounts.entries())
      .filter(([deviceName]) => selectedVids.has(deviceName))
      .map(([deviceName, count]) => ({ deviceName, count }));

          // Log the data being used to draw the bars
  console.log('Data for bars:', data);


    const x = d3.scaleBand()
      .range([margin.left, width - margin.right])
      .domain(data.map(d => d.deviceName))
      .padding(0.1);

    const y = d3.scaleLinear()
      .range([height - margin.bottom, margin.top])
      .domain([0, d3.max(data, d => d.count) || 1]);

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Draw bars
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.deviceName)!)
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - margin.bottom - y(d.count))
      .attr('fill', 'steelblue');

    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('dx', '-0.8em')
      .attr('dy', '0.15em')
      .style('text-anchor', 'end')
      .style('fill', 'white');

    // Add y-axis
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('fill', 'white');

  }, [deviceCounts, selectedVids]);

  return (
    <div className="device-distribution">
      <h3>Device Type Distribution</h3>
      <div className="device-selection">
        <div className="selected-devices">
          {Array.from(deviceCounts.keys()).map((deviceName) => (
            <button
              key={deviceName}
              className={`device-button ${selectedVids.has(deviceName) ? 'selected' : ''}`}
              onClick={() => {
                const newSelected = new Set(selectedVids);
                if (newSelected.has(deviceName)) {
                  newSelected.delete(deviceName);
                } else {
                  newSelected.add(deviceName);
                }
                setSelectedVids(newSelected);
              }}
            >
              {deviceName}
            </button>
          ))}
        </div>
        <div className="selection-controls">
          <button
            onClick={() => setSelectedVids(new Set(deviceCounts.keys()))}
          >
            Select All
          </button>
          <button
            onClick={() => setSelectedVids(new Set())}
          >
            Clear All
          </button>
        </div>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
}