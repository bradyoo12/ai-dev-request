import { cn } from '@/lib/utils';

/**
 * Centralized status color mapping for design system consistency
 *
 * Color scheme:
 * - Success/Completed: green
 * - In Progress/Running: blue
 * - Failed/Error: red
 * - Pending/Waiting: yellow
 * - Cancelled/Stopped: gray/warm
 */
export type StatusType =
  | 'completed'
  | 'success'
  | 'running'
  | 'in-progress'
  | 'in_progress'
  | 'starting'
  | 'failed'
  | 'error'
  | 'pending'
  | 'waiting'
  | 'cancelled'
  | 'stopped'
  | 'idle';

const statusColorMap: Record<StatusType, string> = {
  // Success states - green
  completed: 'bg-green-900/50 text-green-400 border-green-700/50',
  success: 'bg-green-900/50 text-green-400 border-green-700/50',

  // Active/In-progress states - blue
  running: 'bg-blue-900/50 text-blue-400 border-blue-700/50',
  'in-progress': 'bg-blue-900/50 text-blue-400 border-blue-700/50',
  in_progress: 'bg-blue-900/50 text-blue-400 border-blue-700/50',
  starting: 'bg-blue-900/50 text-blue-400 border-blue-700/50',

  // Error states - red
  failed: 'bg-red-900/50 text-red-400 border-red-700/50',
  error: 'bg-red-900/50 text-red-400 border-red-700/50',

  // Waiting states - yellow
  pending: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50',
  waiting: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50',

  // Inactive states - gray/warm
  cancelled: 'bg-warm-700 text-warm-400 border-warm-600',
  stopped: 'bg-warm-700 text-warm-400 border-warm-600',
  idle: 'bg-warm-700 text-warm-400 border-warm-600',
};

export interface StatusBadgeProps {
  status: string;
  className?: string;
  animate?: boolean;
}

/**
 * Consistent status badge component with centralized color mapping
 *
 * @example
 * ```tsx
 * <StatusBadge status="completed" />
 * <StatusBadge status="running" animate />
 * <StatusBadge status="failed" className="text-xs" />
 * ```
 */
export function StatusBadge({ status, className, animate = false }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-') as StatusType;
  const colorClass = statusColorMap[normalizedStatus] || statusColorMap.idle;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        colorClass,
        animate && (normalizedStatus === 'running' || normalizedStatus === 'in-progress' || normalizedStatus === 'in_progress' || normalizedStatus === 'starting') && 'animate-pulse',
        className
      )}
    >
      {status}
    </span>
  );
}

/**
 * Get status color classes programmatically (for custom badge implementations)
 *
 * @example
 * ```tsx
 * const colors = getStatusColors('completed');
 * <div className={colors}>Custom badge</div>
 * ```
 */
export function getStatusColors(status: string): string {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-') as StatusType;
  return statusColorMap[normalizedStatus] || statusColorMap.idle;
}
