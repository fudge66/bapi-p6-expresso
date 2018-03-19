const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = require('./menu-items');

menusRouter.param('menuId', (req, res, next, menuId) => {
  db.get(`SELECT * FROM "Menu" WHERE id = $id;`, {$id: menuId}, (err, menu) => {
    if (err) {
      return next(err);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

menusRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM "Menu"`, (err, menus) => {
    if (err) {
      return next(err);
    }
    res.status(200).json({menus: menus});
  });
});

menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});

menusRouter.post('/', (req, res, next) => {
  const title = req.body.menu.title;
  if (!title) {
    res.sendStatus(400);
  }

  db.run(`INSERT INTO "Menu" (title) VALUES ($title);`, {$title: title}, function(err) {
      if (err) {
        return next(err);
      }
      db.get(`SELECT * FROM "Menu" WHERE id = $id`, {$id: this.lastID}, (err, menu) => {
        res.status(201).json({menu: menu});
      });
    });
});

menusRouter.put('/:menuId', (req, res, next) => {
  const id = req.params.menuId;
        title = req.body.menu.title
  if (!title) {
    res.sendStatus(400);
  }

  const sql = `UPDATE "Menu"
               SET "title" = $title
               WHERE "id" = $id;`,
        values = {
          $id: id,
          $title: title
        };

  db.run(sql, values, (err) => {
    if (err) {
      return next(err);
    }
    db.get(`SELECT * FROM "Menu" WHERE id = $id;`, {$id: id}, (err, menu) => {
      res.status(200).json({menu: menu});
    });
  });
});

menusRouter.delete('/:menuId', (req, res, next) => {
  const id = req.params.menuId;

  db.get(`SELECT * FROM "MenuItem" WHERE "menu_id" = $id;`, {$id: id}, (err, menuItem) => {
    if (err) {
      return next(err);
    } else if (menuItem) {
      res.sendStatus(400);
    } else {
      db.run(`DELETE FROM "Menu" WHERE "id" = $id;`, {$id: id}, err => {
        if (err) {
          return next(err);
        }
        res.sendStatus(204);
      });
    }
  });
});

module.exports = menusRouter;