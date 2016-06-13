const express = require('express');
const sequelize = require('sequelize');

const models = require('../models');

function formatIds(idString) {
   return idString && idString.split(',').filter(id => !isNaN(id)).map(id => +id);
}

module.exports = express.Router()
.get('/menus', (req, res) => {
   const restaurantIds = formatIds(req.query.restaurants);
   const areaIds = formatIds(req.query.areas);

   let where = {};
   if (restaurantIds)
      where['id'] = {$in: restaurantIds};
   else if (areaIds)
      where['AreaId'] = {$in: areaIds};

   models.Restaurant.findAll({
      where,
      include: [
         {
            required: false,
            model: models.Menu,
            where: {
               day: {$gte: sequelize.fn('date_trunc', 'day', sequelize.fn('now'))}
            }
         }
      ],
      order: sequelize.col('day')
   })
   .then(restaurants => {
      const response = restaurants.reduce((carry, restaurant) => {
         carry[restaurant.id] = restaurant.Menus.reduce((carry, menu) => {
            const fields = menu.getPublicAttributes(req.lang);
            carry[fields.day] = fields.courses;
            return carry;
         }, {});
         return carry;
      }, {});
      res.json(response);
   });
});
