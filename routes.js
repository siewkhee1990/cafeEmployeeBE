const employeeController = require("./controllers/employee.js");
const cafeController = require("./controllers/cafe.js");
const employmentControllers = require("./controllers/employment.js");

module.exports = (app) => {
  app.use("/employees", employeeController);
  app.use("/cafes", cafeController);
  app.use("/employments", employmentControllers);
};
