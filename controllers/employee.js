const express = require("express");
const router = express.Router();
const Employees = require("../models/employees.js");
const Cafes = require("../models/cafes.js");
const EmploymentHistories = require("../models/employmentHistories.js");

const generateRandomString = (n) => {
  const funcName = `${generateRandomString.name}:`;
  console.log(`${funcName} started`);
  let randomString = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < n; i++) {
    randomString += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  console.log(`${funcName} done`);
  return randomString;
};

const getDaysWorked = (startDate) => {
  if (!startDate) {
    return null;
  }
  const currentDay = new Date();
  return Math.floor(
    (currentDay.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
  );
};

const generateEmployeeId = async () => {
  const funcName = `${generateEmployeeId.name}:`;
  console.log(`${funcName} started`);
  let uniqueEmployeeId;
  do {
    const id = `UI${generateRandomString(7)}`;
    const employeeFound = await Employees.findOne({ id });
    if (!employeeFound) {
      uniqueEmployeeId = id;
    }
  } while (!uniqueEmployeeId);
  console.log(`${funcName} done`);
  return uniqueEmployeeId;
};

const validateEmployeeInfo = (data) => {
  const funcName = `${validateEmployeeInfo.name}:`;
  console.log(`${funcName} started`);
  const errorList = [];
  let validatedPayload = {};

  const requiredList = ["email_address", "name", "phone_number", "gender"];
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
    const dataEmailAdd = data.email_address;
    const dataName = data.name;
    const dataPhoneNum = data.phone_number;
    const dataGender = data.gender;
    const dataAssignCafeId = data.assignCafeId;
    if (!dataEmailAdd || !dataEmailAdd.trim()) {
      errorList.push(`email_address cannot be empty or null`);
    } else {
      const emailAdd = dataEmailAdd.trim().toLowerCase();
      if (!emailAdd.includes("@")) {
        errorList.push(`email_address is not valid, must have '@'`);
      } else {
        validatedPayload.email_address = emailAdd;
      }
    }
    if (!dataName || !dataName.trim()) {
      errorList.push(`name cannot be empty or null`);
    } else {
      const name = dataName.trim().toLowerCase();
      if (name.length < 6 || name.length > 10) {
        errorList.push(`name must be between 6 to 10 characters`);
      } else {
        validatedPayload.name = name;
      }
    }
    if (!dataPhoneNum) {
      errorList.push(`phone_number cannot be empty or null`);
    } else {
      if (typeof dataPhoneNum === "number") {
        if (dataPhoneNum < 80000000 || dataPhoneNum > 99999999) {
          errorList.push(
            `invalid phone_number input, must start from 8 or 9 and has total 8 digits`
          );
        } else {
          validatedPayload.phone_number = dataPhoneNum;
        }
      } else if (typeof dataPhoneNum === "string") {
        const parsedPhoneNum = parseInt(dataPhoneNum.trim().replace(/\s/g, ""));
        if (parsedPhoneNum < 80000000 || parsedPhoneNum > 99999999) {
          errorList.push(
            `invalid phone_number input, must start from 8 or 9 and has total 8 digits`
          );
        } else {
          validatedPayload.phone_number = parsedPhoneNum;
        }
      }
    }
    if (!dataGender || !dataGender.trim()) {
      errorList.push(`gender cannot be empty or null`);
    } else {
      const gender = dataGender.trim().toLowerCase();
      if (!["male", "female"].includes(gender)) {
        errorList.push(`invalid gender input, must be 'male' or 'female'`);
      } else {
        validatedPayload.gender = gender;
      }
    }
    if (dataAssignCafeId) {
      const uuidRegexExp =
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
      const uuid = dataAssignCafeId.trim();
      if (!uuidRegexExp.test(uuid)) {
        errorList.push(`assignCafeId must be a valid uuid`);
      } else {
        validatedPayload.assignCafeId = uuid;
      }
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
  console.log("employee GET");
  try {
    console.log("query", req.query);
    const { cafe } = req.query;
    let queryParamsPassed = false;
    let responseData = [];
    if (cafe) {
      queryParamsPassed = true;
    }
    if (!queryParamsPassed) {
      const employeeList = await Employees.aggregate([
        { $match: { status: "active" } },
        {
          $lookup: {
            from: "employmenthistories",
            let: { id: "$id" },
            as: "currentAssignment",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$employeeId", "$$id"] },
                      { $eq: ["$employment_end_date", null] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "cafes",
                  let: { cafeId: "$cafeId" },
                  as: "cafeDetails",
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ["$id", "$$cafeId"] },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ]);
      responseData = employeeList
        .map((element) => {
          const [currentAssignment] = element.currentAssignment;
          return {
            ...element,
            days_worked:
              currentAssignment &&
              Object.hasOwn(currentAssignment, "employment_start_date")
                ? getDaysWorked(currentAssignment.employment_start_date)
                : 0,
            cafeDetails:
              currentAssignment &&
              Object.hasOwn(currentAssignment, "cafeDetails")
                ? currentAssignment.cafeDetails[0]
                : null,
            cafe:
              currentAssignment &&
              Object.hasOwn(currentAssignment, "cafeDetails")
                ? currentAssignment.cafeDetails[0]["name"]
                : null,
            currentAssignment: currentAssignment,
          };
        })
        .sort((a, b) => {
          return b.days_worked - a.days_worked;
        });
    }
    if (queryParamsPassed) {
      const employeeList = await EmploymentHistories.aggregate([
        {
          $match: { $and: [{ employment_end_date: null }, { cafeId: cafe }] },
        },
        {
          $lookup: {
            from: "employees",
            let: { id: "$employeeId" },
            as: "employeeDetails",
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
        {
          $lookup: {
            from: "cafes",
            let: { cafeId: "$cafeId" },
            as: "cafeDetails",
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$id", "$$cafeId"] },
                },
              },
            ],
          },
        },
      ]);
      responseData = employeeList
        .map((element) => {
          console.log(element);
          const { employment_start_date } = element;
          const [cafeDetails] = element.cafeDetails;
          return {
            ...element,
            employeeDetails: element.employeeDetails[0],
            days_worked: employment_start_date
              ? getDaysWorked(employment_start_date)
              : 0,
            cafeDetails: cafeDetails,
            cafe: cafeDetails["name"],
          };
        })
        .sort((a, b) => {
          return b.days_worked - a.days_worked;
        });
    }
    return res.status(200).json({ data: responseData });
  } catch (error) {
    console.log(error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || "unexpected error occurred" });
  }
});

router.post("", async (req, res) => {
  console.log("employee POST started");
  try {
    console.log("body", req.body);
    const validatedPayload = validateEmployeeInfo(req.body);
    if (validatedPayload.errorList?.length) {
      throw { status: 400, message: validatedPayload.errorList.join("::") };
    }
    const { email_address, phone_number } = validatedPayload;
    const employeesFound = await Employees.find({
      $and: [
        {
          $or: [{ phone_number }, { email_address }],
        },
        { status: "active" },
      ],
    });
    if (employeesFound.length) {
      throw { status: 404, message: `duplicated employee data` };
    }
    const cafeFound = await Cafes.find({
      id: validatedPayload.assignCafeId,
    });
    if (!cafeFound.length) {
      throw {
        status: 404,
        message: `no cafe found for assignCafeId supplied`,
      };
    }
    const newEmployeeId = await generateEmployeeId();
    const newEmployee = await Employees.create({
      id: newEmployeeId,
      name: validatedPayload.name,
      email_address: validatedPayload.email_address,
      phone_number: validatedPayload.phone_number,
      gender: validatedPayload.gender,
      status: "active",
    });
    const employmentHistory = await EmploymentHistories.create({
      employeeId: newEmployeeId,
      cafeId: cafeFound[0].id,
      employment_start_date: new Date(),
      employment_end_date: null,
    });

    res.status(200).json({ data: newEmployee });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || "unexpected error occurred" });
  }
});

router.put("/:id", async (req, res) => {
  console.log("employee PUT");
  console.log("params", req.params);
  console.log("body", req.body);
  try {
    const { id } = req.params;
    if (!id) {
      throw { status: 400, message: `required params id` };
    }
    const validatedPayload = validateEmployeeInfo(req.body);
    if (validatedPayload.errorList?.length) {
      throw { status: 400, message: validatedPayload.errorList.join("::") };
    }
    const employeeFound = await Employees.find({ id, status: "active" });
    if (!employeeFound?.length) {
      throw { status: 404, message: `no cafe found on id ${id} provided` };
    }
    const update = {
      name: validatedPayload.name,
      email_address: validatedPayload.email_address,
      phone_number: validatedPayload.phone_number,
      gender: validatedPayload.gender,
    };
    const returnData = await Employees.findOneAndUpdate(
      { id },
      { $set: update }
    );
    res.status(200).json({ data: returnData });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || "unexpected error occurred" });
  }
});

router.delete("/:id", async (req, res) => {
  console.log("employee DELETE");
  console.log("params", req.params);
  try {
    const { id } = req.params;
    if (!id) {
      throw { status: 400, message: `invalid id params` };
    }
    const existingEmployee = await Employees.find({ id, status: "active" });
    if (!existingEmployee?.length) {
      throw { status: 404, message: `no employee found on id:${id}` };
    }
    const currentEmployment = await EmploymentHistories.find({
      employeeId: id,
      employment_end_date: null,
    });
    if (currentEmployment?.length) {
      throw {
        status: 400,
        message: `please remove all employee from cafe before deleting`,
      };
    }
    const deletedEmployee = await Employees.findOneAndUpdate(
      { id },
      { $set: { status: "inactive" } }
    );
    return res.status(200).json({ data: deletedEmployee });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || "unexpected error occurred" });
  }
});

module.exports = router;
