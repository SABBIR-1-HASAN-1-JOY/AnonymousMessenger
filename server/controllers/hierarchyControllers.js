// controllers/hierarchyControllers.js
const { buildHierarchy } = require('../services/hierarchyServices');

const getHierarchy = async (req, res) => {
  try {
    const hierarchy = await buildHierarchy();
    res.status(200).json(hierarchy);
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = {
  getHierarchy
};