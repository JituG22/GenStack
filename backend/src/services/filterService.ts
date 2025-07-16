import { FilterQuery } from "mongoose";

export interface FilterOperator {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "between";
  value: any;
  value2?: any; // For 'between' operator
}

export interface DateRangeFilter {
  field: string;
  startDate?: Date;
  endDate?: Date;
  preset?:
    | "today"
    | "yesterday"
    | "last7days"
    | "last30days"
    | "last90days"
    | "thisMonth"
    | "lastMonth"
    | "thisYear"
    | "lastYear";
}

export interface AdvancedFilter {
  operators?: FilterOperator[];
  dateRanges?: DateRangeFilter[];
  search?: {
    query: string;
    fields: string[];
    fuzzy?: boolean;
  };
  sort?: {
    field: string;
    order: "asc" | "desc";
  }[];
  pagination?: {
    page: number;
    limit: number;
  };
}

export class FilterService {
  /**
   * Build MongoDB query from advanced filters
   */
  static buildQuery(filters: AdvancedFilter): FilterQuery<any> {
    const query: FilterQuery<any> = {};
    const andConditions: FilterQuery<any>[] = [];

    // Handle operator filters
    if (filters.operators && filters.operators.length > 0) {
      filters.operators.forEach((op) => {
        const condition = this.buildOperatorCondition(op);
        if (condition) {
          andConditions.push(condition);
        }
      });
    }

    // Handle date range filters
    if (filters.dateRanges && filters.dateRanges.length > 0) {
      filters.dateRanges.forEach((dateRange) => {
        const condition = this.buildDateRangeCondition(dateRange);
        if (condition) {
          andConditions.push(condition);
        }
      });
    }

    // Handle search filters
    if (filters.search && filters.search.query) {
      const searchCondition = this.buildSearchCondition(filters.search);
      if (searchCondition) {
        andConditions.push(searchCondition);
      }
    }

    // Combine all conditions
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    return query;
  }

  /**
   * Build condition for operator filters
   */
  private static buildOperatorCondition(
    op: FilterOperator
  ): FilterQuery<any> | null {
    const { field, operator, value, value2 } = op;

    if (!field || value === undefined || value === null || value === "") {
      return null;
    }

    switch (operator) {
      case "eq":
        return { [field]: value };

      case "ne":
        return { [field]: { $ne: value } };

      case "gt":
        return { [field]: { $gt: value } };

      case "gte":
        return { [field]: { $gte: value } };

      case "lt":
        return { [field]: { $lt: value } };

      case "lte":
        return { [field]: { $lte: value } };

      case "in":
        return { [field]: { $in: Array.isArray(value) ? value : [value] } };

      case "nin":
        return { [field]: { $nin: Array.isArray(value) ? value : [value] } };

      case "contains":
        return { [field]: { $regex: value, $options: "i" } };

      case "startsWith":
        return { [field]: { $regex: `^${value}`, $options: "i" } };

      case "endsWith":
        return { [field]: { $regex: `${value}$`, $options: "i" } };

      case "between":
        if (value2 !== undefined) {
          return { [field]: { $gte: value, $lte: value2 } };
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Build condition for date range filters
   */
  private static buildDateRangeCondition(
    dateRange: DateRangeFilter
  ): FilterQuery<any> | null {
    const { field, startDate, endDate, preset } = dateRange;

    if (!field) return null;

    let start: Date | undefined = startDate;
    let end: Date | undefined = endDate;

    // Handle presets
    if (preset) {
      const now = new Date();

      switch (preset) {
        case "today":
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23,
            59,
            59
          );
          break;

        case "yesterday":
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          start = new Date(
            yesterday.getFullYear(),
            yesterday.getMonth(),
            yesterday.getDate()
          );
          end = new Date(
            yesterday.getFullYear(),
            yesterday.getMonth(),
            yesterday.getDate(),
            23,
            59,
            59
          );
          break;

        case "last7days":
          start = new Date(now);
          start.setDate(start.getDate() - 7);
          end = now;
          break;

        case "last30days":
          start = new Date(now);
          start.setDate(start.getDate() - 30);
          end = now;
          break;

        case "last90days":
          start = new Date(now);
          start.setDate(start.getDate() - 90);
          end = now;
          break;

        case "thisMonth":
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;

        case "lastMonth":
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;

        case "thisYear":
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;

        case "lastYear":
          start = new Date(now.getFullYear() - 1, 0, 1);
          end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
          break;
      }
    }

    // Build query condition
    const condition: any = {};

    if (start && end) {
      condition[field] = { $gte: start, $lte: end };
    } else if (start) {
      condition[field] = { $gte: start };
    } else if (end) {
      condition[field] = { $lte: end };
    } else {
      return null;
    }

    return condition;
  }

  /**
   * Build condition for search filters
   */
  private static buildSearchCondition(search: {
    query: string;
    fields: string[];
    fuzzy?: boolean;
  }): FilterQuery<any> | null {
    const { query, fields, fuzzy } = search;

    if (!query || !fields || fields.length === 0) {
      return null;
    }

    const searchRegex = fuzzy
      ? this.buildFuzzyRegex(query)
      : { $regex: query, $options: "i" };

    if (fields.length === 1) {
      return { [fields[0]]: searchRegex };
    }

    // Search across multiple fields
    const orConditions = fields.map((field) => ({
      [field]: searchRegex,
    }));

    return { $or: orConditions };
  }

  /**
   * Build fuzzy search regex for handling typos
   */
  private static buildFuzzyRegex(query: string): any {
    // Simple fuzzy search implementation
    // For production, consider using libraries like fuse.js or implementing Levenshtein distance
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const fuzzyPattern = escapedQuery.split("").join(".*?"); // Allow any characters between each letter

    return { $regex: fuzzyPattern, $options: "i" };
  }

  /**
   * Build sort object from sort filters
   */
  static buildSort(filters: AdvancedFilter): any {
    if (!filters.sort || filters.sort.length === 0) {
      return { createdAt: -1 }; // Default sort by creation date
    }

    const sortObj: any = {};
    filters.sort.forEach((sort) => {
      sortObj[sort.field] = sort.order === "asc" ? 1 : -1;
    });

    return sortObj;
  }

  /**
   * Validate filter parameters
   */
  static validateFilters(filters: AdvancedFilter): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate operators
    if (filters.operators) {
      filters.operators.forEach((op, index) => {
        if (!op.field) {
          errors.push(`Operator ${index}: field is required`);
        }
        if (!op.operator) {
          errors.push(`Operator ${index}: operator is required`);
        }
        if (op.operator === "between" && op.value2 === undefined) {
          errors.push(
            `Operator ${index}: value2 is required for 'between' operator`
          );
        }
      });
    }

    // Validate date ranges
    if (filters.dateRanges) {
      filters.dateRanges.forEach((dateRange, index) => {
        if (!dateRange.field) {
          errors.push(`Date range ${index}: field is required`);
        }
        if (
          dateRange.startDate &&
          dateRange.endDate &&
          dateRange.startDate > dateRange.endDate
        ) {
          errors.push(`Date range ${index}: startDate must be before endDate`);
        }
      });
    }

    // Validate search
    if (filters.search) {
      if (!filters.search.query) {
        errors.push("Search: query is required");
      }
      if (!filters.search.fields || filters.search.fields.length === 0) {
        errors.push("Search: at least one field is required");
      }
    }

    // Validate pagination
    if (filters.pagination) {
      if (filters.pagination.page < 1) {
        errors.push("Pagination: page must be >= 1");
      }
      if (filters.pagination.limit < 1 || filters.pagination.limit > 100) {
        errors.push("Pagination: limit must be between 1 and 100");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get filter suggestions based on field type and existing data
   */
  static async getFilterSuggestions(
    model: any,
    field: string,
    query?: string
  ): Promise<any[]> {
    try {
      const pipeline: any[] = [
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ];

      // Add text search if query provided
      if (query) {
        pipeline.unshift({
          $match: {
            [field]: { $regex: query, $options: "i" },
          },
        });
      }

      const suggestions = await model.aggregate(pipeline);
      return suggestions.map((item: any) => ({
        value: item._id,
        count: item.count,
      }));
    } catch (error) {
      console.error("Error getting filter suggestions:", error);
      return [];
    }
  }
}
