import React from 'react';
import { LayoutAction } from '../../types/snapping';

interface WindowSnapIconProps {
  width?: number;
  height?: number;
  action: LayoutAction;
}

export const WindowSnapIcon: React.FC<WindowSnapIconProps> = ({
  width = 50,
  height = 30,
  action,
}) => {
  // Calculate the position and size based on the action
  const getPosition = (): { x: number; y: number; width: number; height: number } => {
    const screenWidth = 50;
    const screenHeight = 30;

    switch (action) {
      case LayoutAction.LeftHalf:
        return { x: 0, y: 0, width: screenWidth / 2, height: screenHeight };
      case LayoutAction.RightHalf:
        return { x: screenWidth / 2, y: 0, width: screenWidth / 2, height: screenHeight };
      case LayoutAction.CenterHalf:
        return { x: screenWidth / 4, y: 0, width: screenWidth / 2, height: screenHeight };
      case LayoutAction.TopHalf:
        return { x: 0, y: 0, width: screenWidth, height: screenHeight / 2 };
      case LayoutAction.BottomHalf:
        return { x: 0, y: screenHeight / 2, width: screenWidth, height: screenHeight / 2 };
      case LayoutAction.TopLeft:
        return { x: 0, y: 0, width: screenWidth / 2, height: screenHeight / 2 };
      case LayoutAction.TopRight:
        return { x: screenWidth / 2, y: 0, width: screenWidth / 2, height: screenHeight / 2 };
      case LayoutAction.BottomLeft:
        return { x: 0, y: screenHeight / 2, width: screenWidth / 2, height: screenHeight / 2 };
      case LayoutAction.BottomRight:
        return { x: screenWidth / 2, y: screenHeight / 2, width: screenWidth / 2, height: screenHeight / 2 };
      case LayoutAction.FirstThird:
        return { x: 0, y: 0, width: screenWidth / 3, height: screenHeight };
      case LayoutAction.CenterThird:
        return { x: screenWidth / 3, y: 0, width: screenWidth / 3, height: screenHeight };
      case LayoutAction.LastThird:
        return { x: 2 * screenWidth / 3, y: 0, width: screenWidth / 3, height: screenHeight };
      case LayoutAction.FirstTwoThirds:
        return { x: 0, y: 0, width: 2 * screenWidth / 3, height: screenHeight };
      case LayoutAction.LastTwoThirds:
        return { x: screenWidth / 3, y: 0, width: 2 * screenWidth / 3, height: screenHeight };
      case LayoutAction.Maximize:
        return { x: 0, y: 0, width: screenWidth, height: screenHeight };
      case LayoutAction.AlmostMaximize:
        return { x: screenWidth / 20, y: screenHeight / 20, width: 18 * screenWidth / 20, height: 18 * screenHeight / 20 };
      case LayoutAction.MaximizeHeight:
        return { x: 0, y: 0, width: screenWidth, height: screenHeight };
      case LayoutAction.Center:
        return { x: screenWidth / 4, y: 0, width: screenWidth / 2, height: screenHeight };
      case LayoutAction.CenterProminently:
        return { x: screenWidth / 5, y: screenHeight / 5, width: 3 * screenWidth / 5, height: 3 * screenHeight / 5 };
      case LayoutAction.FirstFourth:
        return { x: 0, y: 0, width: screenWidth / 4, height: screenHeight };
      case LayoutAction.SecondFourth:
        return { x: screenWidth / 4, y: 0, width: screenWidth / 4, height: screenHeight };
      case LayoutAction.ThirdFourth:
        return { x: 2 * screenWidth / 4, y: 0, width: screenWidth / 4, height: screenHeight };
      case LayoutAction.LastFourth:
        return { x: 3 * screenWidth / 4, y: 0, width: screenWidth / 4, height: screenHeight };
      case LayoutAction.FirstThreeFourths:
        return { x: 0, y: 0, width: 3 * screenWidth / 4, height: screenHeight };
      case LayoutAction.LastThreeFourths:
        return { x: screenWidth / 4, y: 0, width: 3 * screenWidth / 4, height: screenHeight };
      case LayoutAction.TopLeftSixth:
        return { x: 0, y: 0, width: screenWidth / 3, height: screenHeight / 2 };
      case LayoutAction.TopCenterSixth:
        return { x: screenWidth / 3, y: 0, width: screenWidth / 3, height: screenHeight / 2 };
      case LayoutAction.TopRightSixth:
        return { x: 2 * screenWidth / 3, y: 0, width: screenWidth / 3, height: screenHeight / 2 };
      case LayoutAction.BottomLeftSixth:
        return { x: 0, y: screenHeight / 2, width: screenWidth / 3, height: screenHeight / 2 };
      case LayoutAction.BottomCenterSixth:
        return { x: screenWidth / 3, y: screenHeight / 2, width: screenWidth / 3, height: screenHeight / 2 };
      case LayoutAction.BottomRightSixth:
        return { x: 2 * screenWidth / 3, y: screenHeight / 2, width: screenWidth / 3, height: screenHeight / 2 };
      case LayoutAction.TopLeftThird:
        return { x: 0, y: 0, width: screenWidth / 3, height: screenHeight };
      case LayoutAction.TopRightThird:
        return { x: 2 * screenWidth / 3, y: 0, width: screenWidth / 3, height: screenHeight };
      case LayoutAction.BottomLeftThird:
        return { x: 0, y: 0, width: screenWidth / 3, height: screenHeight };
      case LayoutAction.BottomRightThird:
        return { x: 2 * screenWidth / 3, y: 0, width: screenWidth / 3, height: screenHeight };
      default:
        return { x: 0, y: 0, width: screenWidth, height: screenHeight };
    }
  };

  const position = getPosition();
  const pathData = `m${position.x.toFixed(2)} ${position.y.toFixed(2)}v${position.height.toFixed(2)}h${position.width.toFixed(2)}v-${position.height.toFixed(2)}z`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.2"
      viewBox={`0 0 50 30`}
      width={width}
      height={height}
    >
      <style>
        {`
          .s0 { fill: #e0e0e0; stroke: #ababab; stroke-miterlimit: 10 }
          .s1 { fill: #1e90ff; stroke: #1e90ff; stroke-miterlimit: 10; stroke-width: 0 }
        `}
      </style>
      <g id="Layer 1">
        <path
          id="Shape 1"
          fillRule="evenodd"
          className="s0"
          d="m47 3v24h-44v-24z"
        />
        <path
          id="Shape 2"
          fillRule="evenodd"
          className="s1"
          d={pathData}
        />
      </g>
    </svg>
  );
}; 