const Sequelize = require('sequelize');

module.exports = {
    name: { type: Sequelize.STRING(128), allowNull: true },
    email: { type: Sequelize.STRING(255), allowNull: true },
    website: { type: Sequelize.TEXT(), allowNull: true },
    parent: { type: Sequelize.INTEGER(), allowNull: true },
    content: { type: Sequelize.TEXT(), allowNull: false },
    hidden: { type: Sequelize.BOOLEAN(), allowNull: false },
    byAdmin: { type: Sequelize.BOOLEAN(), allowNull: false },
    receiveEmail: { type: Sequelize.BOOLEAN(), allowNull: false },
    editKey: { type: Sequelize.STRING(16), allowNull: false },
};
