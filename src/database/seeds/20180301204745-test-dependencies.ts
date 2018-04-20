/* tslint:disable:object-literal-sort-keys */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const environmentAId = await queryInterface.rawSelect("environmentVersions", {
      where: {
        name: "sampleBundle.A",
        version : "0.1.2"
      }
    }, ["id"]);

    const environmentABId = await queryInterface.rawSelect("environmentVersions", {
      where: {
        name: "sampleBundle.A.B",
        version: "0.1.1"
      }
    }, ["id"]);

    return queryInterface.bulkInsert("bundleDependencies", [{
      dependent: environmentABId,
      dependency: environmentAId,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }])
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("bundleDependencies", null, {});
  }
};
