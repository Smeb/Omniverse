'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("bundleVersions", [{
      bundleNamespace: "sampleBundle",
      name: "sampleBundle.A",
      version: "0.1.1",
      latest: false,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      bundleNamespace: "sampleBundle",
      name: "sampleBundle.A",
      version: "0.1.2",
      latest: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      bundleNamespace: "sampleBundle",
      name: "sampleBundle.B",
      version: "0.1.1",
      latest: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }], {});

    const bundleAId1 = await queryInterface.rawSelect("bundleVersions", {
      where: {
        name: "sampleBundle.A",
        version : "0.1.1"
      }
    }, ["id"]);

    const bundleAId2 = await queryInterface.rawSelect("bundleVersions", {
      where: {
        name: "sampleBundle.A",
        version : "0.1.2"
      }
    }, ["id"]);

    const bundleBId1 = await queryInterface.rawSelect("bundleVersions", {
      where: {
        name: "sampleBundle.B",
        version : "0.1.1"
      }
    }, ["id"]);

    return queryInterface.bulkInsert("bundleLocations", [{
      bundleVersionId: bundleAId1,
      type: "env",
      hash: "bundleA1hashenv",
      crc: "bundleA1crc",
      uri: "bundleA1uri",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      bundleVersionId: bundleAId1,
      type: "dll",
      hash: "bundleA1hashdll",
      crc: "bundleA1crc",
      uri: "bundleA1uri",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      bundleVersionId: bundleAId2,
      type: "env",
      hash: "bundleA2hash",
      crc: "bundleA2crc",
      uri: "bundleA2uri",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      bundleVersionId: bundleBId1,
      type: "dll",
      hash: "bundleB1hash",
      crc: "bundleA1crc",
      uri: "bundleA1uri",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }], {});

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("bundleVersions", null, {});
  }
};
