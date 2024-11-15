export interface Node {
    id: string;
    env: string;
    ip_hash: string;
    browsers: string;
    ua_devices: string;
    cities: string;
    standardised_name: string;
    size?: number;
    color?: string;
    x?: number;
    y?: number;
  }
  
  export interface Link {
    source: string;
    target: string;
    time: string;
    relationship: string;
    width?: number;
    color?: string;
  }
  
  export interface SearchAccessor {
    key: keyof Node;
    label: string;
  }