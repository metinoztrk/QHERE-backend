const express = require("express");
const router = express.Router();
const respond = require("../helpers/respond");
const verifier = require("./../helpers/verifier");

const StudentService = require("../services/StudentService.js");

router.get("/getClasses", verifier.verifyToken, function(req, res, next) {
  StudentService.getClasses(req)
    .then(result => {
      respond.success(res, result);
    })
    .catch(err => {
      respond.withError(res, err);
    });
});

router.get("/getUserClasses", verifier.verifyToken, function(req, res, next) {
  StudentService.getUserClasses(req)
    .then(result => {
      respond.success(res, result);
    })
    .catch(err => {
      respond.withError(res, err);
    });
});

router.post("/:id/joinClass", verifier.verifyToken, function(req, res, next) {
  StudentService.joinClass(req)
    .then(result => {
      respond.success(res, result);
    })
    .catch(err => {
      respond.withError(res, err);
    });
});

router.post("/:classId/joinRollCall/:qhereId", verifier.verifyToken, function(req, res, next) {
  StudentService.joinRollCall(req)
    .then(result => {
      respond.success(res, result);
    })
    .catch(err => {
      respond.withError(res, err);
    });
});

module.exports = router;
