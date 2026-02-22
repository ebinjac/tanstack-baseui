// Enterprise Scorecard constants

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

// Get current date info
const now = new Date();
export const CURRENT_YEAR = now.getFullYear();
export const CURRENT_MONTH = now.getMonth() + 1;

// Available years for selection
export const AVAILABLE_YEARS = Array.from(
  { length: 5 },
  (_, i) => CURRENT_YEAR - i
);

// Leadership filter types
export const LEADERSHIP_TYPES = [
  { value: "all", label: "All Leadership" },
  { value: "svp", label: "SVP" },
  { value: "vp", label: "VP" },
  { value: "director", label: "Director" },
  { value: "app_owner", label: "Application Owner" },
  { value: "app_manager", label: "Application Manager" },
  { value: "unit_cio", label: "Unit CIO" },
] as const;

// Range options for data display
export const RANGE_OPTIONS = [
  { value: "full", label: "Full Year" },
  { value: "ytd", label: "Year to Date" },
  { value: "last3", label: "Last 3 Months" },
  { value: "last6", label: "Last 6 Months" },
  { value: "last12", label: "Last 12 Months" },
] as const;
