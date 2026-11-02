import buildingsData from '../data/buildings.json';

/**
 * Get all buildings.
 * @returns {Array} List of all buildings.
 */
export function getAllBuildings() {
  return buildingsData;
}

/**
 * Get a building by its ID.
 * @param {string} id - The ID of the building.
 * @returns {Object|null} The building object or null if not found.
 */
export function getBuildingById(id) {
  return buildingsData.find(building => building.id === id) || null;
}

/**
 * Generate static parameters for all buildings and floors.
 * @returns {Array} List of static parameters for Next.js.
 */
export function generateBuildingFloorStaticParams() {
  const params = [];
  
  buildingsData.forEach(building => {
    building.floors.forEach(floor => {
      params.push({
        buildingId: building.id,
        floorId: floor.id // Add building and floor IDs to parameters
      });
    });
  });
  
  return params; // Return the list of static parameters
}
