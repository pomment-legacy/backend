const Sequelize = require('sequelize');

module.exports = {
    url: { type: Sequelize.STRING(), allowNull: false, unique: true },
    title: { type: Sequelize.STRING(), allowNull: false },
    post: { type: Sequelize.INTEGER(), allowNull: false },
};
