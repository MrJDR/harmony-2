import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TaskDependencyArrow {
  fromTaskId: string;
  toTaskId: string;
}

interface DependencyArrowsProps {
  dependencies: TaskDependencyArrow[];
  taskPositions: Map<string, { top: number; left: number; width: number; height: number }>;
  containerWidth: number;
  showDependencies: boolean;
}

export function DependencyArrows({ 
  dependencies, 
  taskPositions, 
  containerWidth,
  showDependencies,
}: DependencyArrowsProps) {
  const arrows = useMemo(() => {
    if (!showDependencies) return [];

    return dependencies
      .map((dep) => {
        const fromPos = taskPositions.get(dep.fromTaskId);
        const toPos = taskPositions.get(dep.toTaskId);

        if (!fromPos || !toPos) return null;

        // Calculate start point (right edge of predecessor)
        const startX = fromPos.left + fromPos.width;
        const startY = fromPos.top + fromPos.height / 2;

        // Calculate end point (left edge of successor)
        const endX = toPos.left;
        const endY = toPos.top + toPos.height / 2;

        // Calculate control points for bezier curve
        const horizontalDistance = endX - startX;
        const controlPointOffset = Math.min(Math.max(horizontalDistance * 0.3, 20), 80);

        // Determine if arrow needs to wrap around
        const isWrapAround = horizontalDistance < 30;

        let path: string;
        if (isWrapAround) {
          // Wrap around: go down/up and around
          const wrapOffset = 20;
          const midY = (startY + endY) / 2;
          path = `
            M ${startX} ${startY}
            C ${startX + wrapOffset} ${startY}, ${startX + wrapOffset} ${midY}, ${startX + wrapOffset} ${midY}
            L ${endX - wrapOffset} ${midY}
            C ${endX - wrapOffset} ${midY}, ${endX - wrapOffset} ${endY}, ${endX} ${endY}
          `;
        } else {
          // Normal bezier curve
          path = `
            M ${startX} ${startY}
            C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}
          `;
        }

        return {
          id: `${dep.fromTaskId}-${dep.toTaskId}`,
          path,
          startX,
          startY,
          endX,
          endY,
        };
      })
      .filter(Boolean);
  }, [dependencies, taskPositions, showDependencies]);

  if (!showDependencies || arrows.length === 0) {
    return null;
  }

  return (
    <svg 
      className="absolute inset-0 pointer-events-none overflow-visible z-10"
      style={{ width: containerWidth, height: '100%' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path 
            d="M0,0 L8,4 L0,8 L2,4 Z" 
            className="fill-primary"
          />
        </marker>
        <marker
          id="arrowhead-warning"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path 
            d="M0,0 L8,4 L0,8 L2,4 Z" 
            className="fill-warning"
          />
        </marker>
      </defs>
      
      {arrows.map((arrow) => (
        <g key={arrow!.id}>
          {/* Shadow/glow effect */}
          <path
            d={arrow!.path}
            className="stroke-primary/20 fill-none"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Main arrow line */}
          <path
            d={arrow!.path}
            className="stroke-primary fill-none transition-all duration-200 hover:stroke-primary/80"
            strokeWidth="2"
            strokeLinecap="round"
            markerEnd="url(#arrowhead)"
          />
          {/* Start dot */}
          <circle
            cx={arrow!.startX}
            cy={arrow!.startY}
            r="3"
            className="fill-primary"
          />
        </g>
      ))}
    </svg>
  );
}

// Hook to collect task positions for dependency arrows
export function useTaskPositions() {
  const taskPositions = new Map<string, { top: number; left: number; width: number; height: number }>();

  const registerTaskPosition = (
    taskId: string, 
    position: { top: number; left: number; width: number; height: number }
  ) => {
    taskPositions.set(taskId, position);
  };

  return { taskPositions, registerTaskPosition };
}
