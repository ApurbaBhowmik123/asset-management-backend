import { query } from 'express-validator';

export type SortOrder = 'asc' | 'desc';

/**
 * Returns a reusable validator middleware for paginated endpoints.
 * @param allowedSortFields - List of allowed field names to sort by
 */
export function paginationValidator(allowedSortFields: string[]) {
  return [
    // Page
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be an integer >= 1')
      .toInt(),

    // Limit
    query('limit')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Limit must be an integer >= 1')
      .toInt(),

    // Search
    query('search')
      .optional()
      .isString()
      .withMessage('Search must be a string')
      .trim()
      .escape(),

    // SortBy
    query('sortBy')
      .optional()
      .isIn(allowedSortFields)
      .withMessage((value) => `Invalid sortBy field: '${value}'. Allowed: ${allowedSortFields.join(', ')}`),

    // SortOrder
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage("SortOrder must be either 'asc' or 'desc'")
  ];
}
