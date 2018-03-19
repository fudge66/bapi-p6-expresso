const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  db.get(`SELECT * FROM "Timesheet" WHERE id = $id;`,
    {$id: timesheetId},
    (err, timesheet) => {
      if (err) {
        return next(err);
      } else if (timesheet) {
        req.timesheet = timesheet;
        next();
      } else {
        res.sendStatus(404);
      }
    });
});

timesheetsRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM "Timesheet" WHERE "employee_id" = $id`,
    {$id: req.params.employeeId},
    (err, timesheets) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({timesheets: timesheets});
    });
});

timesheetsRouter.post('/', (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date,
        employeeId = req.params.employeeId;
  if (!hours || !rate || !date || !employeeId) {
    res.sendStatus(400);
  }

  const sql = `INSERT INTO "Timesheet" (hours, rate, date, employee_id)
               VALUES ($hours, $rate, $date, $employeeId);`,
        values = {
          $hours: hours,
          $rate: rate,
          $date: date,
          $employeeId: employeeId
        };

  db.run(sql, values, function(err) {
    if (err) {
      return next(err);
    }
    db.get(`SELECT * FROM "Timesheet" WHERE id = $id`, {$id: this.lastID}, (err, timesheet) => {
      res.status(201).json({timesheet: timesheet});
    });
  });
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const id = req.params.timesheetId;
        hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date
  if (!hours || !rate || !date) {
    res.sendStatus(400);
  }

  const sql = `UPDATE "Timesheet"
               SET "hours" = $hours, "rate" = $rate, "date" = $date
               WHERE "id" = $id;`,
        values = {
          $id: id,
          $hours: hours,
          $rate: rate,
          $date: date,
        };

  db.run(sql, values, (err) => {
    if (err) {
      return next(err);
    }
    db.get(`SELECT * FROM "Timesheet" WHERE id = $id;`, {$id: id}, (err, timesheet) => {
      res.status(200).json({timesheet: timesheet});
    });
  });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  db.run(`DELETE FROM "Timesheet" WHERE id = $id;`, {$id: req.params.timesheetId}, err => {
    if (err) {
      return next(err);
    }
    res.sendStatus(204);
  });
});

module.exports = timesheetsRouter;