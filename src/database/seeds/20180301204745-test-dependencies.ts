/* tslint:disable:object-literal-sort-keys */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const bundleAId = await queryInterface.rawSelect("bundleVersions", {
      where: {
        name: "sampleBundle.A",
        version : "0.1.2"
      }
    }, ["id"]);

    const bundleBId = await queryInterface.rawSelect("bundleVersions", {
      where: {
        name: "sampleBundle.B",
        version: "0.1.1"
      }
    }, ["id"]);

    return queryInterface.bulkInsert("bundleDependencies", [{
      dependent: bundleAId,
      dependency: bundleBId,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }])
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("bundleDependencies", null, {});
  }
};
