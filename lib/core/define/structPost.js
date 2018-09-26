const Sequelize = require('sequelize');

module.exports = {
    name: { type: Sequelize.STRING(128), allowNull: true },
    email: { type: Sequelize.STRING(255), allowNull: true },
    website: { type: Sequelize.TEXT(), allowNull: true },
    parent: { type: Sequelize.INTEGER(), allowNull: true },
    content: { type: Sequelize.TEXT(), allowNull: false },
    moderated: { type: Sequelize.BOOLEAN(), allowNull: false },
    hidden: { type: Sequelize.BOOLEAN(), allowNull: false },
    birth: { type: Sequelize.DATE(), allowNull: false },
    by_admin: { type: Sequelize.BOOLEAN(), allowNull: false },
    receive_email: { type: Sequelize.BOOLEAN(), allowNull: false },
};
