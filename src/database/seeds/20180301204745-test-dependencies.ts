/* tslint:disable:object-literal-sort-keys */
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("bundleDependencies", [{
      dependent: "sampleBundleHashA2",
      dependency: "sampleBundleHashB1",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }])
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("bundleDependencies", null, {});
  }
};
