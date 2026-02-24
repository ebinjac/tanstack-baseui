import { format } from "date-fns";

export interface ItsmChange {
  approval: string;
  assignment_group: string;
  close_code: string;
  cmdb_ci: string;
  description: string;
  end_date: string;
  number: string;
  opened_at: string;
  priority: string;
  short_description: string;
  start_date: string;
  state: string;
}

export interface ItsmIncident {
  assigned_to: string;
  assignment_group: string;
  incident_state: string;
  number: string;
  opened_at: string;
  priority: string;
  short_description: string;
}

export interface ItsmApiResponse<T> {
  Data: T[];
}

const BASE_URL = "http://localhost:8008/api";

export const ITSMClient = {
  /**
   * Fetch changes from the ITSM API
   */
  async getChanges(params: {
    assignment_group: string;
    opened_at_min: Date;
    opened_at_max: Date;
    cmdb_ci?: string;
  }): Promise<ItsmChange[]> {
    const queryParams = new URLSearchParams({
      assignment_group: params.assignment_group,
      opened_at_min: format(params.opened_at_min, "yyyy-MM-dd"),
      opened_at_max: format(params.opened_at_max, "yyyy-MM-dd"),
    });

    if (params.cmdb_ci) {
      queryParams.append("cmdb_ci", params.cmdb_ci);
    }

    const response = await fetch(
      `${BASE_URL}/change?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch changes: ${response.statusText}`);
    }

    const result: ItsmApiResponse<ItsmChange> = await response.json();
    return result.Data;
  },

  /**
   * Fetch incidents from the ITSM API
   */
  async getIncidents(params: {
    assignment_group: string;
    opened_at_min: Date;
    opened_at_max: Date;
  }): Promise<ItsmIncident[]> {
    const queryParams = new URLSearchParams({
      assignment_group: params.assignment_group,
      opened_at_min: format(params.opened_at_min, "yyyy-MM-dd"),
      opened_at_max: format(params.opened_at_max, "yyyy-MM-dd"),
    });

    const response = await fetch(
      `${BASE_URL}/incidents?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch incidents: ${response.statusText}`);
    }

    const result: ItsmApiResponse<ItsmIncident> = await response.json();
    return result.Data;
  },
};
