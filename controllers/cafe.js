const express = require("express");
const router = express.Router();
const Cafes = require("../models/cafes.js");
const crypto = require("crypto");
const Employees = require("../models/employees.js");
const EmploymentHistories = require("../models/employmentHistories.js");

const generateCafeId = async () => {
  const funcName = `${generateCafeId.name}:`;
  console.log(`${funcName} started`);
  let uniqueCafeId;
  do {
    const id = crypto.randomUUID();
    const cafeFound = await Cafes.findOne({ id });
    if (!cafeFound) {
      uniqueCafeId = id;
    }
  } while (!uniqueCafeId);
  console.log(`${funcName} done`);
  return uniqueCafeId;
};

const validateCafeInfo = (data) => {
  const funcName = `${validateCafeInfo.name}:`;
  console.log(`${funcName} started`);
  const errorList = [];
  let validatedPayload = {};

  const requiredList = ["name", "description", "location"];
  requiredList.forEach((element) => {
    if (!Object.hasOwn(data, element)) {
      errorList.push(`missing ${element} key in request body`);
    }
  });
  if (errorList.length) {
    console.log(`${funcName} done A`);
    return {
      ...validatedPayload,
      errorList,
    };
  } else {
    const { name, description, location } = data;
    if (!name || !name.trim()) {
      errorList.push(`name cannot be empty or null`);
    } else {
      const transformedName = name.trim().toLowerCase();
      if (transformedName.length < 6 || transformedName.length > 10) {
        errorList.push(`name must be between 6 to 10 characters`);
      } else {
        validatedPayload.name = transformedName;
      }
    }
    if (!description || !description.trim()) {
      errorList.push(`description cannot be empty or null`);
    } else {
      const transformedDesc = description.trim();
      if (transformedDesc.length > 256) {
        errorList.push(`description must not exceed 256 characters`);
      } else {
        validatedPayload.description = transformedDesc;
      }
    }
    if (!location || !location.trim()) {
      errorList.push(`location cannot be empty or null`);
    } else {
      const transformedLocation = location.trim().toLowerCase();
      validatedPayload.location = transformedLocation;
    }
    console.log(`${funcName} done B`);
    if (errorList.length) {
      return {
        ...validatedPayload,
        errorList,
      };
    } else {
      return validatedPayload;
    }
  }
};

router.get("", async (req, res) => {
  console.log("cafe GET started");
  try {
    console.log("query", req.query);
    const { location } = req.query;
    const data = await Cafes.aggregate([
      { $match: { status: "active" } },
      {
        $lookup: {
          from: "employmenthistories",
          let: { id: "$id" },
          as: "employees",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$cafeId", "$$id"] },
                    { $eq: ["$employment_end_date", null] },
                  ],
                },
              },
            },
            // {
            //   $group: {
            //     _id: { cafeId: { "cafeId": "$cafeId" } },
            //     totalEmployees: {
            //       $sum: 1,
            //     },
            //   },
            // },
          ],
        },
      },
    ]);
    let responseData = data
      .map((element) => {
        element = {
          ...element,
          totalEmployees: element.employees.length,
        };
        return element;
      })
      .sort((a, b) => b.totalEmployees - a.totalEmployees);
    if (location) {
      responseData = responseData.filter((element) => {
        return element.location === location;
      });
    }
    return res.status(200).json({ data: responseData });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || "unexpected error occurred" });
  }
});

router.post("", async (req, res) => {
  console.log("cafe POST started");
  try {
    console.log("body", req.body);
    const validatedPayload = validateCafeInfo(req.body);
    if (validatedPayload.errorList?.length) {
      throw { status: 400, message: validatedPayload.errorList.join("::") };
    }
    const { name, location } = validatedPayload;
    const cafeFound = await Cafes.find({
      $and: [{ name }, { location }, { status: "active" }],
    });
    if (cafeFound?.length) {
      throw { status: 400, message: `duplicated cafe data` };
    }
    const newCafeId = await generateCafeId();
    const newCafe = await Cafes.create({
      id: newCafeId,
      name,
      location,
      description: validatedPayload.description,
      status: "active",
    });
    return res.status(200).json({ data: newCafe });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || "unexpected error occurred" });
  }
});

router.put("/:id", async (req, res) => {
  console.log("cafe PUT");
  console.log("params", req.params);
  console.log("body", req.body);
  try {
    const { id } = req.params;
    if (!id) {
      throw { status: 400, message: `required params id` };
    }
    const cafeFound = await Cafes.find({ id, status: "active" });
    if (!cafeFound?.length) {
      throw { status: 404, message: `no cafe found on id ${id} provided` };
    }
    const validatedPayload = validateCafeInfo(req.body);
    if (validatedPayload.errorList?.length) {
      throw { status: 400, message: validatedPayload.errorList.join("::") };
    }
    const { name, location } = validatedPayload;
    const existingCafeFound = await Cafes.find({
      $and: [{ name }, { location }, { status: "active" }],
      id: { $nin: [id] },
    });
    if (existingCafeFound?.length) {
      throw {
        status: 400,
        message: `there is a cafe with the same name and location found`,
      };
    }
    const updatedCafe = await Cafes.findOneAndUpdate(
      { id },
      { $set: validatedPayload }
    );
    return res.status(200).json({ data: updatedCafe });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || "unexpected error occurred" });
  }
});

router.delete("/:id", async (req, res) => {
  console.log("cafe DELETE");
  console.log("params", req.params);
  try {
    const { id } = req.params;
    if (!id) {
      throw { status: 400, message: `required params id` };
    }
    const cafeFound = await Cafes.find({ id, status: "active" });
    if (!cafeFound?.length) {
      throw { status: 404, message: `no cafe found on id ${id} provided` };
    }
    const currentEmployeeList = await EmploymentHistories.find({
      $and: [
        {
          cafeId: cafeFound[0].id,
        },
        { employment_end_date: null },
      ],
    });
    if (currentEmployeeList?.length) {
      throw {
        status: 400,
        message: `please remove all employees before deleting the cafe`,
      };
    }
    const terminatedCafe = await Cafes.findOneAndUpdate(
      { id },
      { $set: { status: "inactive" } }
    );
    return res.status(200).json({ data: terminatedCafe });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || "unexpected error occurred" });
  }
});

module.exports = router;
