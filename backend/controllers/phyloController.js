// For demonstration only, returns a static tree
exports.getPhylogeneticTree = async (req, res) => {
    try {
      // 1. Retrieve all significant comparisons from DB, and
      //    generate a tree data structure from them.
      // 2. For now, we’ll just return a sample structure.
  
      const sampleTreeData = {
        name: "Root Manuscript",
        attributes: { date: "1400 CE", location: "Rome" },
        children: [
          {
            name: "Manuscript A",
            attributes: { date: "1450 CE", location: "Paris" },
            children: [
              {
                name: "Manuscript A.1",
                attributes: { date: "1500 CE", location: "Lyon" }
              },
              {
                name: "Manuscript A.2",
                attributes: { date: "1520 CE", location: "Avignon" }
              }
            ]
          },
          {
            name: "Manuscript B",
            attributes: { date: "1460 CE", location: "Florence" },
            children: [
              {
                name: "Manuscript B.1",
                attributes: { date: "1490 CE", location: "Venice" }
              }
            ]
          }
        ]
      };
  
      return res.json(sampleTreeData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to retrieve phylogenetic tree' });
    }
  };
  