/**
 * Search Utilities - Centralized search and validation logic
 * Handles room searching, input validation, and floor/building parsing
 */

/**
 * Search for a room by query string in the rooms database
 * Tries exact match first, then building+room number combination
 * @param {string} query - The search query (trimmed and lowercased)
 * @param {Array} rooms - Array of room objects with uniqueId property
 * @returns {Object|null} The matched room object, or null if not found
 */
export const searchForRoom = (query, rooms) => {
  const lower = query.toLowerCase().trim();

  // Try exact match on uniqueId
  let match = rooms.find(room => (room.uniqueId || '').toLowerCase() === lower);

  if (!match) {
    // Try building + room number combination (e.g., "b2210" -> "B" + "2210")
    match = rooms.find(room => {
      const [building, , roomNumber] = (room.uniqueId || '').split('-');
      if (!building || !roomNumber) return false;
      return (building.toLowerCase() + roomNumber.toLowerCase()) === lower;
    });
  }

  return match || null;
};

/**
 * Validate that a search input is not empty
 * @param {string} input - The user input to validate
 * @returns {boolean} True if input is valid (non-empty string)
 */
export const validateSearchInput = (input) => {
  if (!input || typeof input !== 'string') return false;
  return input.trim().length > 0;
};

/**
 * Parse floor input (e.g., "b2" -> {building: "B", floor: "2"})
 * @param {string} input - The user input (should be letter + digit)
 * @returns {Object|null} Object with building and floor, or null if invalid
 */
export const parseFloorInput = (input) => {
  const match = String(input).toLowerCase().match(/^([a-z])(\d)$/);
  if (!match) return null;
  return { building: match[1].toUpperCase(), floor: match[2] };
};

/**
 * Format error message for room not found
 * @param {string} query - The original search query
 * @returns {string} Formatted error message
 */
export const formatNotFoundError = (query) => `"${query}" not found`;

/**
 * Format error message for invalid format
 * @returns {string} Formatted error message
 */
export const formatInvalidFormatError = () => 'Invalid room format.';

/**
 * Get query type and format for navigation
 * Returns the navigation path info for a given search result
 * @param {Object} room - The room object found
 * @returns {Object|null} Object with building, floor, and room info, or null
 */
export const extractRoomNavInfo = (room) => {
  if (!room || !room.uniqueId) return null;

  // Expected format: "BUILDING-LEVEL-ROOMNUMBER"
  const [building, level, roomNumber] = room.uniqueId.split('-');
  if (!building || !level || !roomNumber) return null;

  return {
    building: building.toUpperCase(),
    floor: level,
    roomNumber: roomNumber
  };
};
