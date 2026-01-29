/**
 * Pagination constants to prevent unbounded queries
 * Performance optimization (PR#19)
 */

/** Default number of items per page */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum allowed items per page to prevent large queries */
export const MAX_PAGE_SIZE = 100;

/** Default page number */
export const DEFAULT_PAGE = 1;

/**
 * Clamp a page size value to be within allowed limits
 * @param limit - Requested page size
 * @returns Clamped page size between 1 and MAX_PAGE_SIZE
 */
export function clampPageSize(limit?: number): number {
  if (!limit || limit < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(limit, MAX_PAGE_SIZE);
}

/**
 * Ensure page number is valid (at least 1)
 * @param page - Requested page number
 * @returns Valid page number
 */
export function clampPage(page?: number): number {
  if (!page || page < 1) {
    return DEFAULT_PAGE;
  }
  return page;
}
