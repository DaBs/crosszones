export interface Zone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  number: number;
}

export interface ZoneLayout {
  id: string;
  name: string;
  zones: Zone[];
  screenWidth?: number;
  screenHeight?: number;
}

