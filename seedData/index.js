const fs = require("node:fs/promises");
const seedCafesList = require("./cafes.json");
const seedEmployeeList = require("./employees.json");
const seedEmploymentList = require("./employmenthistories.json");
const Cafes = require("../models/cafes");
const Employees = require("../models/employees");
const EmploymentHistories = require("../models/employmentHistories");

const populateDB = async () => {
  const [cafeList, employeeList, employmentList] = await Promise.all([
    Cafes.find({}).count(),
    Employees.find({}).count(),
    EmploymentHistories.find({}).count(),
  ]);
  if (cafeList === 0 && employeeList === 0 && employmentList === 0) {
    console.log("start ingest data");
    const insertCafes = Cafes.insertMany(seedCafesList).then((result) =>
      console.log("Cafes Ingestions: done...")
    );
    const insertEmployees = Employees.insertMany(seedEmployeeList).then(
      (result) => console.log("Employees Ingestions: done...")
    );
    const insertEmployment = EmploymentHistories.insertMany(
      seedEmploymentList
    ).then((result) => console.log("Employment Ingestions: done..."));
    await Promise.all([insertCafes, insertEmployees, insertEmployment]);
    console.log("data ingestion completed");
  } else {
    console.log("db initialised, skipping database seeding");
  }
};

module.exports = populateDB;
