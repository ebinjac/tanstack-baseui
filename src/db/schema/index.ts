export * from "./application-groups";
export * from "./links";
export * from "./scorecard";
export * from "./teams";
export * from "./turnover";

import {
  applicationGroupMemberships,
  applicationGroupMembershipsRelations,
  applicationGroups,
  applicationGroupsRelations,
} from "./application-groups";

import {
  linkCategories,
  linkCategoriesRelations,
  links,
  linksRelations,
  linkVisibility,
} from "./links";

import {
  scorecardAvailability,
  scorecardAvailabilityRelations,
  scorecardEntries,
  scorecardEntriesRelations,
  scorecardPublishStatus,
  scorecardPublishStatusRelations,
  scorecardVolume,
  scorecardVolumeRelations,
} from "./scorecard";
// Default export with explicit named imports for better tree-shaking
import {
  applicationStatus,
  applications,
  applicationsRelations,
  approvalStatus,
  ensembleSchema,
  syncStatus,
  teamRegistrationRequests,
  teams,
  teamsRelations,
} from "./teams";

import {
  finalizedTurnovers,
  finalizedTurnoversRelations,
  turnoverCommsDetails,
  turnoverCommsDetailsRelations,
  turnoverEntries,
  turnoverEntriesRelations,
  turnoverIncDetails,
  turnoverIncDetailsRelations,
  turnoverMimDetails,
  turnoverMimDetailsRelations,
  turnoverRfcDetails,
  turnoverRfcDetailsRelations,
  turnoverSection,
  turnoverStatus,
} from "./turnover";

export default {
  ensembleSchema,
  approvalStatus,
  applicationStatus,
  syncStatus,
  teams,
  teamRegistrationRequests,
  applications,
  teamsRelations,
  applicationsRelations,
  linkVisibility,
  linkCategories,
  links,
  linkCategoriesRelations,
  linksRelations,
  scorecardEntries,
  scorecardAvailability,
  scorecardPublishStatus,
  scorecardVolume,
  scorecardEntriesRelations,
  scorecardAvailabilityRelations,
  scorecardVolumeRelations,
  scorecardPublishStatusRelations,
  applicationGroups,
  applicationGroupMemberships,
  applicationGroupsRelations,
  applicationGroupMembershipsRelations,
  turnoverSection,
  turnoverStatus,
  turnoverEntries,
  turnoverRfcDetails,
  turnoverIncDetails,
  turnoverMimDetails,
  turnoverCommsDetails,
  finalizedTurnovers,
  turnoverEntriesRelations,
  turnoverRfcDetailsRelations,
  turnoverIncDetailsRelations,
  turnoverMimDetailsRelations,
  turnoverCommsDetailsRelations,
  finalizedTurnoversRelations,
};
