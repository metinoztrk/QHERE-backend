const _ = require("lodash");
const Class = require("../models/Class");
const User = require("../models/Users");
const ClassesRequest = require("../models/ClassRequest");
const TokenService = require("./TokenService");
const ManagerError = require("../errors/ManagerError");
const AuthError = require("../errors/AuthError");
const SystemError = require("../errors/SystemError");
ManagerService = {};

ManagerService.createClass = req => {
  return new Promise((resolve, reject) => {
    User.find({
        _id: req.tokenData.userId
      }) // findOne ile query atılırsa [0] a gerek kalmaz.
      .then(userInstance => {
        const {
          className,
          lastJoinTime,
          quota,
          discontinuity,
          description
        } = req.body;
        let createClass = Class({
          managerId: req.tokenData.userId,
          className,
          lastJoinTime,
          quota,
          discontinuity,
          description,
          managerName: userInstance[0].fullName
        });
        createClass
          .save()
          .then(classInstance => {
            return resolve(classInstance);
          })
          .catch(err => {
            return reject(ManagerError.BusinessException());
          });
        return resolve(createClass);
      })
      .catch(err => {
        return reject(ManagerError.BusinessException());
      });
  });
};

ManagerService.ApproveStudents = req => {
  //Her hoca sadece kendi sınıfına ekleyebilmeli. verifyManager olmalı

  return new Promise((resolve, reject) => {
    TokenService.verifyToken(req.headers.authorization).then(userId => {
      User.find({
          schoolNumber: req.body.schoolNumber
        })
        .then(instance => {
          //schollNumber unique olmalı
          const id = instance[0]._id.toString();
          Class.find({
              _id: req.params.id
            })
            .then(collection => {
              const studentId = collection[0].students.find(
                student => student.userId == id
              );
              if (!studentId) {
                var newUser = {
                  userId: instance[0]._id,
                  fullName: instance[0].fullName,
                  email: instance[0].email,
                  schoolNumber: instance[0].schoolNumber
                };
                Class.findOneAndUpdate({
                    _id: req.params.id
                  }, {
                    $push: {
                      students: newUser
                    }
                  }, {
                    new: true
                  })
                  .then(updateClass => {
                    if (collection[0].students.length == collection[0].quota) {
                      return reject(ManagerError.BadRequest());
                    } else {
                      return resolve(updateClass);
                    }
                  })
                  .catch(err => {
                    return reject(SystemError.BusinessException(err));
                  });
              } else {
                return reject(ManagerError.NotAcceptable());
              }
            })
            .catch(err => {
              return reject(SystemError.BusinessException(err));
            });
        })
        .catch(err => {
          return reject(SystemError.BusinessException(err));
        });
    });
  });
};

ManagerService.RejectStudents = req => {
  return new Promise((resolve, reject) => {
    TokenService.verifyToken(req.headers.authorization).then(userId => {
      Class.find({
        _id: req.params.id
      }).then(classInstance => {
        let instance =
          classInstance[0].className + " sınıfına yaptığınız istek reddedildi."; //!!Hocanın servisi öğrenci bu mesajı göremez.
        return resolve(instance);
      });
    });
  });
};

ManagerService.getClasses = req => {
  return new Promise((resolve, reject) => {
    Class.find({
        managerId: token.userId
      })
      .then(classes => {
        return resolve(classes);
      })
      .catch(err => {
        return reject(ManagerError.BadRequest());
      });
  });
};

ManagerService.getClassInfo = req => {
  return new Promise((resolve, reject) => {
    Class.find({
        _id: req.params.id
      })
      .then(classInstance => {
        return resolve(classInstance);
      })
      .catch(err => {
        return reject(ManagerError.BadRequest());
      });
  });
};

ManagerService.getClassesRequest = req => {
  return new Promise((resolve, reject) => {
    ClassesRequest.find({
        managerId: req.tokenData.userId
      })
      .then(students => {
        return resolve(students);
      })
      .catch(err => {
        return reject(err)
      })

  });
};

module.exports = ManagerService;