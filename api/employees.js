const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = require('./timesheets');

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  db.get(`SELECT * FROM "Employee" WHERE id = $id;`,
    {$id: employeeId},
    (err, employee) => {
      if (err) {
        return next(err);
      } else if (employee) {
        req.employee = employee;
        next();
      } else {
        res.sendStatus(404);
      }
    }
  );
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM "Employee" WHERE "Employee"."is_current_employee" = 1;',
    (err, employees) => {
      if (err) {
        return next(err);
      } else {
        res.status(200).json({employees: employees});
      }
    });
});

employeesRouter.post('/', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    res.sendStatus(400);
  }

  const sql = `INSERT INTO "Employee" (name, position, wage, is_current_employee) 
               VALUES ($name, $position, $wage, $isCurrentEmployee);`,
        values = {
          $name: name,
          $position: position,
          $wage: wage,
          $isCurrentEmployee: isCurrentEmployee
        };

  db.run(sql, values, function(err) {
    if (err) {
      return next(err);
    }
    db.get(`SELECT * FROM "Employee" WHERE "id" = $id;`, {$id: this.lastID}, (err, employee) => {
      res.status(201).json({employee: employee});
    });
  });
});

employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});

employeesRouter.put('/:employeeId', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    res.sendStatus(400);
  }

  const sql = `UPDATE "Employee" 
               SET "name" = $name, "position" = $position, 
                   "wage" = $wage, "is_current_employee" = $isCurrentEmployee 
               WHERE "id" = $id;`,
        values = {
          $id: req.params.employeeId,
          $name: name,
          $position: position,
          $wage: wage,
          $isCurrentEmployee: isCurrentEmployee
        };

  db.run(sql, values, function(err) {
    if (err) {
      return next(err);
    }
    db.get(`SELECT * FROM "Employee" WHERE "id" = $id;`, {$id: req.params.employeeId}, (err, employee) => {
      res.status(200).json({employee: employee});
    });
  });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
  db.run(`UPDATE "Employee" SET "is_current_employee" = 0 WHERE id = $id;`,
    {$id: req.params.employeeId},
    (err) => {
      if (err) {
        return next(err);
      }
      db.get(`SELECT * FROM "Employee" WHERE "id" = $id;`, {$id: req.params.employeeId}, (err, employee) => {
        res.status(200).json({employee: employee});
      });
    });
});

module.exports = employeesRouter;