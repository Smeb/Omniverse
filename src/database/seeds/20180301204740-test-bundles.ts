'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("bundleVersions", [{
      bundleNamespace: "sampleBundle",
      name: "sampleBundle.A",
      version: "0.1.1",
      uri: "sampleBundle.Ahash1",
      latest: false,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      bundleNamespace: "sampleBundle",
      name: "sampleBundle.A",
      uri: "sampleBundle.Ahash2",
      version: "0.1.2",
      latest: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      bundleNamespace: "sampleBundle",
      name: "sampleBundle.B",
      uri: "sampleBundle.Bhash1",
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
