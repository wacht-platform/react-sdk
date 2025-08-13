/**
 * Unified execution status mapping between frontend and backend
 */

// Frontend status values
export const FRONTEND_STATUS = {
  IDLE: 'idle',
  STARTING: 'starting', 
  RUNNING: 'running',
  WAITING_FOR_INPUT: 'waiting_for_input',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

// Backend status values
export const BACKEND_STATUS = {
  IDLE: 'Idle',
  STARTING: 'Starting',
  RUNNING: 'Running',
  WAITING_FOR_INPUT: 'WaitingForInput',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled'
} as const;

export type FrontendStatus = typeof FRONTEND_STATUS[keyof typeof FRONTEND_STATUS];
export type BackendStatus = typeof BACKEND_STATUS[keyof typeof BACKEND_STATUS];

/**
 * Map backend status to frontend status
 */
export function mapBackendToFrontendStatus(backendStatus: string): FrontendStatus {
  switch (backendStatus) {
    case BACKEND_STATUS.IDLE:
      return FRONTEND_STATUS.IDLE;
    case BACKEND_STATUS.STARTING:
      return FRONTEND_STATUS.STARTING;
    case BACKEND_STATUS.RUNNING:
      return FRONTEND_STATUS.RUNNING;
    case BACKEND_STATUS.WAITING_FOR_INPUT:
      return FRONTEND_STATUS.WAITING_FOR_INPUT;
    case BACKEND_STATUS.COMPLETED:
      return FRONTEND_STATUS.COMPLETED;
    case BACKEND_STATUS.FAILED:
    case BACKEND_STATUS.CANCELLED:
      return FRONTEND_STATUS.FAILED;
    default:
      console.warn(`Unknown backend status: ${backendStatus}`);
      return FRONTEND_STATUS.IDLE;
  }
}

/**
 * Map frontend status to backend status
 */
export function mapFrontendToBackendStatus(frontendStatus: FrontendStatus): BackendStatus {
  switch (frontendStatus) {
    case FRONTEND_STATUS.IDLE:
      return BACKEND_STATUS.IDLE;
    case FRONTEND_STATUS.STARTING:
      return BACKEND_STATUS.STARTING;
    case FRONTEND_STATUS.RUNNING:
      return BACKEND_STATUS.RUNNING;
    case FRONTEND_STATUS.WAITING_FOR_INPUT:
      return BACKEND_STATUS.WAITING_FOR_INPUT;
    case FRONTEND_STATUS.COMPLETED:
      return BACKEND_STATUS.COMPLETED;
    case FRONTEND_STATUS.FAILED:
      return BACKEND_STATUS.FAILED;
    default:
      console.warn(`Unknown frontend status: ${frontendStatus}`);
      return BACKEND_STATUS.IDLE;
  }
}

/**
 * Check if status indicates execution is active
 */
export function isExecutionActive(status: FrontendStatus): boolean {
  return status === FRONTEND_STATUS.STARTING || 
         status === FRONTEND_STATUS.RUNNING || 
         status === FRONTEND_STATUS.WAITING_FOR_INPUT;
}

/**
 * Check if status indicates execution has ended
 */
export function isExecutionEnded(status: FrontendStatus): boolean {
  return status === FRONTEND_STATUS.COMPLETED || 
         status === FRONTEND_STATUS.FAILED ||
         status === FRONTEND_STATUS.IDLE;
}