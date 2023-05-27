const express = require("express");
const router = express.Router();
const Employees = require("../models/employees.js");
const Cafes = require("../models/cafes.js");
const EmploymentHistories = require("../models/employmentHistories.js");

router.get("/details/:id", async (req, res) => {
  console.log("employment GET");
  console.log("params", req.params);
  try {
    const { id } = req.params;
    if (!id) {
      throw { status: 400, message: "invalid id params" };
    }
    const employmentHistory = await EmploymentHistories.aggregate([
      {
        $match: { employeeId: id },
      },
      {
        $lookup: {
          from: "cafes",
          let: { id: "$cafeId" },
          as: "cafeInfo",
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$id", "$$id"],
                },
              },
            },
          ],
        },
      },
    ]);
    const responseObj = employmentHistory
      .map((element) => {
        return {
          ...element,
          cafeInfo: element.cafeInfo[0],
        };
      })
      .sort((a, b) => b.employment_start_date - a.employment_start_date);
    return res.status(200).json({ data: responseObj });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || "unexpected error occurred" });
  }
});

router.get("/terminate/:id", async (req, res) => {
  console.log("employment GET");
  console.log("params", req.params);
  try {
    const { id } = req.params;
    if (!id) {
      throw { status: 400, message: "invalid id params" };
    }
    const existingEmployment = await EmploymentHistories.findById(id);
    if (!existingEmployment) {
      throw {
        status: 404,
        message: `no employment found for id ${id}`,
      };
    }
    if (existingEmployment["employment_end_date"]) {
      return res.status(400).json({ message: `employment already terminated` });
    }
    const updatedEmployment = await EmploymentHistories.findByIdAndUpdate(id, {
      employment_end_date: new Date(),
    });
    return res.status(200).json({ data: updatedEmployment });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || "unexpected error occurred" });
  }
});

router.get("/assign/:empId/:cafeId", async (req, res) => {
  console.log("employment GET");
  console.log("params", req.params);
  try {
    const { empId, cafeId } = req.params;
    if (!empId || !cafeId) {
      throw {
        status: 400,
        message: `invalid ${!empId ? "empId" : ""} ${
          !cafeId ? "cafeId" : ""
        } params`,
      };
    }
    const existingEmployee = await Employees.aggregate([
      {
        $match: {
          id: empId,
        },
      },
      {
        $lookup: {
          from: "employmenthistories",
          as: "existingEmployment",
          pipeline: [
            {
              $match: {
                employeeId: empId,
                employment_end_date: null,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "cafes",
          as: "existingCafe",
          pipeline: [
            {
              $match: { id: cafeId },
            },
          ],
        },
      },
    ]);
    console.log(123);
    // const existingEmployee = await Employees.find({ id: empId });
    // if (!existingEmployee?.length) {
    //   throw { status: 404, message: `no employee found for id ${empId}` };
    // }
    // const existingEmployment = await EmploymentHistories.find({
    //   employeeId: empId,
    //   employment_end_date: null,
    // });
    // if (existingEmployment?.length) {
    //   throw { status: 404, message: `existing employment found` };
    // }
    // const existingCafe = await Cafes.find({ id: cafeId });
    // if (!existingCafe?.length) {
    //   throw { status: 404, message: `no cafe found for id ${cafeId}` };
    // }
    // const createdEmployment = await EmploymentHistories.create({
    //   employeeId: empId,
    //   cafeId,
    //   employment_start_date: new Date(),
    //   employment_end_date: null,
    // });
    // return res.status(200).json({ data: createdEmployment });
    return res.status(200).json({ data: existingEmployee });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || "unexpected error occurred" });
  }
});

module.exports = router;
