// services/hierarchyServices.js
const { getHierarchyData } = require('../queries/hierarchyQueries');

const buildHierarchy = async () => {
  try {
    const { sectors, categories, entities } = await getHierarchyData();

    // Build category map safely
    const categoryMap = {};
    const categoriesWithSub = categories.map(cat => ({ ...cat, subcategories: [], entities: [] }));
    categoriesWithSub.forEach(cat => {
      categoryMap[cat.category_id] = cat;
    });

    // Build category tree (handle subcategories)
    categoriesWithSub.forEach(cat => {
      if (cat.parent_category_id) {
        const parent = categoryMap[cat.parent_category_id];
        if (parent) {
          parent.subcategories.push(cat);
        }
      }
    });

    // Attach entities to categories (safe copy)
    entities.forEach(ent => {
      const entityWithSub = { ...ent, sub_entities: [] };
      if (ent.parent_entity_id) {
        const parentEntity = entities.find(e => e.entity_id === ent.parent_entity_id);
        if (parentEntity) {
          // Handle sub-entities later (if needed deeply nested)
        }
      } else {
        const cat = categoryMap[ent.category_id];
        if (cat) {
          cat.entities.push(entityWithSub);
        }
      }
    });

    // Finally attach categories to sectors
    const result = sectors.map(sector => {
      const sectorCategories = categoriesWithSub.filter(cat => cat.sector_id === sector.sector_id);
      return {
        ...sector,
        categories: sectorCategories
      };
    });

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  buildHierarchy
};