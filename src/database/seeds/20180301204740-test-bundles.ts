'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("bundleVersions", [{
      bundleNamespace: "sampleBundle",
      name: "sampleBundle.A",
      hash: "sampleBundle.Ahash1",
      version: "0.1.1",
      latest: false,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      bundleNamespace: "sampleBundle",
      name: "sampleBundle.A",
      hash: "sampleBundle.Ahash2",
      version: "0.1.2",
      latest: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      bundleNamespace: "sampleBundle",
      name: "sampleBundle.B",
      hash: "sampleBundle.BHash1",
      version: "0.1.1",
      latest: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("bundleVersions", null, {});
  }
};
