'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("bundleVersions", [{
      name: "sampleBundleA",
      hash: "sampleBundleHashA1",
      version: "0.1.1",
      latest: false
    }, {
      name: "sampleBundleA",
      hash: "sampleBundleHashA2",
      version: "0.1.2",
      latest: true
    }, {
      name: "sampleBundleB",
      hash: "sampleBundleHashB1",
      version: "0.1.1",
      latest: true
    }], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Bundle", null, {});
  }
};
