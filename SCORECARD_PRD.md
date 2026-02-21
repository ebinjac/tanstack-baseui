Product Requirements Document (PRD) – Ensemble Scorecard

1. Objective
   Provide a scorecard within the Ensemble application that:

Tracks application and sub-application performance on a monthly basis.

Captures and displays:

Availability (in percentage).

Volume (e.g., hits/transactions).

Highlights issues based on configurable thresholds and requires reasons for significant deviations.

2. Scope
   The scorecard applies to all applications in Ensemble.

Each application can have multiple sub-applications (sub-apps).

Data entry is manual for now (availability and volume).

The scorecard is maintained on a yearly and monthly basis.

3. Key Concepts
   Application: A main system or service within Ensemble (e.g., KMS).

Sub-application (Sub-app): Logical subdivisions of an application (e.g., KMS-IDEAL, KMS-V1, KMS-V2).

Availability: Monthly performance metric expressed as a percentage.

Volume: Monthly volume metric (e.g., number of hits/transactions).

Threshold: Configurable limit for availability and acceptable volume change.

Deviation Reason: A mandatory explanation when thresholds are breached.

4. Functional Requirements
   4.1 Application and Sub-application Management
   The scorecard must list all applications configured in Ensemble.

For each application, the user must be able to:

View existing sub-apps.

Add new sub-apps under the main application (e.g., IDEAL, V1, V2).

If no sub-apps are defined for an application:

The main application name itself must appear as the entity in the scorecard (i.e., it is treated as a single unit).

The scorecard must clearly distinguish:

Main application name.

Associated sub-app names.

4.2 Time Period and Yearly View
The scorecard must support a yearly view per application/sub-app.

Users must be able to:

Select a specific year.

View or enter data for each month of the selected year (January to December).

5. Data Entry Requirements
   5.1 Availability Table
   There must be a dedicated Availability table for each application/sub-app.

For each month of the selected year, users must be able to:

Enter availability as a percentage (e.g.,
100
%
100%,
99.5
%
99.5%).

Each row (or record) in the Availability table must at least include:

Application name.

Sub-app name (if applicable).

Year.

Month.

Availability percentage.

Users must be able to update or correct availability entries for previous months within the same year.

5.2 Volume Table
There must be a separate Volume table for each application/sub-app.

For each month of the selected year, users must be able to:

Enter the volume value (e.g., 20000 hits).

Each row (or record) in the Volume table must at least include:

Application name.

Sub-app name (if applicable).

Year.

Month.

Volume value.

Users must be able to update or correct volume entries for previous months within the same year.

6. Thresholds and Rules
   6.1 Availability Threshold
   The scorecard must allow configuration of a threshold for availability (e.g.,
   98
   %
   98%).

The threshold value must be configurable per:

At minimum, per application.

Optional: per sub-app (if required by business).

For each month, if the recorded availability:

Falls below the configured threshold:

The scorecard must:

Visually indicate the breach (e.g., color, icon, or flag).

Display a specific text above or near the percentage indicating that the threshold is not met.

There must be an option to set or change the threshold value without needing technical changes (e.g., via a configuration area in the UI or admin settings).

6.2 Volume Change Threshold
The scorecard must support a threshold for volume change percentage between:

Current month and previous month.

The volume change threshold must be configurable (e.g.,
10
%
10%,
20
%
20%).

The system must calculate the percentage difference between:

Current month volume and previous month volume for the same application/sub-app.

If the absolute percentage difference exceeds the configured volume change threshold:

The scorecard must:

Flag the month as having a significant change.

Require the user to enter a reason.

7. Deviation Explanation Requirements
   When availability falls below its threshold:

The user must be prompted to enter a reason/explanation.

The reason must be stored and retrievable for later review.

When the volume change between months exceeds the configured threshold:

The user must be prompted to enter a reason/explanation.

The reason must be stored and retrievable for later review.

The scorecard must display:

The availability or volume value.

The threshold breach indicator.

The associated reason text (if entered) in a way that is easy to see for reviewers.

8. Display and Layout Requirements
   The scorecard must show data at the sub-app level when sub-apps are defined under an application.

If there are no sub-apps, the scorecard must show data at the main application level using the application name.

The view should support:

Tabular display per application/sub-app with months as columns or rows.

Separation between Availability and Volume (e.g., via two different tables or sections).

For each application/sub-app, users must be able to see:

Monthly availability values for the selected year.

Monthly volume values for the selected year.

Threshold breaches clearly highlighted.

Reasons associated with any breaches.

9. User Actions and Flows
   9.1 General Interaction

Users must see a single consolidated table/grid that lists:

All applications.

Their sub-apps (where applicable).

All months for the selected year.

Availability and volume fields for each month.

Users must be able to edit multiple applications and sub-apps in one place, without navigating or selecting one application at a time.

Users must be able to filter and/or sort the table (e.g., by application, sub-app, year, month) to make editing easier.

Users must be able to select a year at the top-level (e.g., via a year selector), and the table should show data for that year for all applications/sub-apps simultaneously.

9.2 Data Entry and Editing

Within the consolidated table, users must be able to:

Enter or edit monthly availability values directly in the table cells.

Enter or edit monthly volume values directly in the table cells.

Users should be able to edit multiple rows and months in one session before saving changes.

The UI must clearly indicate which cells have been edited and not yet saved.

9.3 Thresholds Management

Availability and volume change thresholds must be:

Viewable in the same screen (either as columns in the table or in a clearly linked configuration area).

Editable where the user has permission.

Thresholds can be:

Common for all applications/sub-apps, or

Specific per application or sub-app, as defined by business rules.

When thresholds are changed, the impact on existing rows (breaches) must be reflected in the same table view (e.g., highlighting).

9.4 Breach Handling and Reasons

When a user enters or edits data in the table:

If availability for a month is below its configured threshold, the corresponding cell or row must be highlighted as a breach.

If the volume change between two consecutive months exceeds the configured threshold, the corresponding month must be highlighted as a breach.

For any breached cell/row, the table must:

Provide a mechanism (e.g., inline field, popup, or adjacent column) for entering a reason/explanation.

Clearly show that a reason is required (e.g., visual indicator in the row).

The system must prevent saving the changes if:

There is at least one breached value (availability or volume change) without an associated reason, where reasons are mandatory.

After save, the table must:

Show all updated values.

Retain breach indicators.

Display the stored reasons in a readable way (e.g., tooltip, expandable text, or dedicated column).

9.5 Bulk and Usability Considerations

Users must be able to:

Scroll through all applications and sub-apps vertically and months horizontally (or vice versa), while staying on the same screen.

Optionally filter down to a subset (e.g., one application or one month) but without losing the ability to see others on demand.

The design should support:

Quick navigation across months.

Efficient bulk updates for multiple applications/sub-apps in one editing session.

10. Non-Functional / General Constraints (Business-Level Only)
    The solution should support manual entry initially, with the possibility of automation in the future (no technical design required here).

The interface and terminology should be consistent with existing Ensemble application naming conventions.

The scorecard should be designed to be used at least once per month for updates, and for yearly review.
