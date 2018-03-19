const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const id = req.params.menuItemId;
  db.get(`SELECT * FROM "MenuItem" WHERE id = $id;`, {$id: id}, (err, menuItem) => {
    if (err) {
      return next(err);
    } else if (menuItem) {
      req.menuItem = menuItem;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menuItemsRouter.get('/', (req, res, next) => {
  const menuId = req.params.menuId;

  db.all(`SELECT * FROM "MenuItem" WHERE "menu_id" = $menuId;`,
    {$menuId: menuId},
    (err, menuItems) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({menuItems: menuItems});
    });
});

menuItemsRouter.post('/', (req, res, next) => {
  const menuId = req.params.menuId,
        name = req.body.menuItem.name,
        description = req.body.menuItem.description,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price;

  if (!menuId || !name || !description || !inventory || !price) {
    res.sendStatus(400);
  }

  const sql = `INSERT INTO "MenuItem" (name, description, inventory, price, menu_id)
               VALUES ($name, $description, $inventory, $price, $menuId);`,
        values = {
          $name: name,
          $description: description,
          $inventory: inventory,
          $price: price,
          $menuId: menuId
        };

  db.run(sql, values, function(err) {
    if (err) {
      return next(err);
    }
    db.get(`SELECT * FROM "MenuItem" WHERE id = $id`, {$id: this.lastID}, (err, menuItem) => {
      res.status(201).json({menuItem: menuItem});
    });
  });
});

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
  const id = req.params.menuItemId,
        name = req.body.menuItem.name,
        description = req.body.menuItem.description,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price;
  if (!name || !description || !inventory || !price) {
    res.sendStatus(400);
  } else {
    const sql = `UPDATE "MenuItem"
                 SET "name" = $name, description = $description, 
                     inventory = $inventory, price = $price
                 WHERE "id" = $id;`,
          values = {
            $id: id,
            $name: name,
            $description: description,
            $inventory: inventory,
            $price: price,
          };

    db.run(sql, values, (err) => {
      if (err) {
        return next(err);
      }
      db.get(`SELECT * FROM "MenuItem" WHERE id = $id;`, {$id: id}, (err, menuItem) => {
        res.status(200).json({menuItem: menuItem});
      });
    });
  }
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  const id = req.params.menuItemId;

  db.run(`DELETE FROM "MenuItem" WHERE "id" = $id;`, {$id: id}, err => {
    if (err) {
      return next(err);
    }
    res.sendStatus(204);
  });
});

module.exports = menuItemsRouter;